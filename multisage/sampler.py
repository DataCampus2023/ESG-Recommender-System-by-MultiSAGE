import dgl
import torch
from torch.utils.data import IterableDataset
from newpinsage import PinSAGESampler

# DGL 그래프 객체에서 주어진 노드와 연결된 edge들을 포함하는 block을 생성하는 함수
def compact_and_copy(frontier, seeds):
    block = dgl.to_block(g=frontier, dst_nodes=seeds)
    for col, data in frontier.edata.items():
        if col == dgl.EID:
            continue
        block.edata[col] = data[block.edata[dgl.EID]]
    return block

# DGL 그래프 객체에서 특정 노드 유형에 대한 node feature 데이터를 추출하여 주어진 노드 데이터에 할당하는 함수
def assign_simple_node_features(ndata, g, ntype, assign_id=False):
    for col in g.nodes[ntype].data.keys():
        if not assign_id and col == dgl.NID:
            continue
        induced_nodes = ndata[dgl.NID]
        ndata[col] = g.nodes[ntype].data[col][induced_nodes]

# DGL 라이브러리(Distributed Graph Library)를 사용하여 그래프 블록에 노드 특성을 할당하는 함수
def assign_features_to_blocks(blocks, g, ntype):
    assign_simple_node_features(blocks[0].srcdata, g, ntype)
    assign_simple_node_features(blocks[-1].dstdata, g, ntype)

# DGL 라이브러리(Distributed Graph Library)를 사용하여 그래프 데이터에서 컨텍스트 블록을 샘플링하는 함수
def sample_context_blocks(g, blocks, context_dicts, ntype, ctype):
    context_blocks = []
    for block, context_dict in zip(blocks, context_dicts):
        context_ids = []
        inner_to_global_id = {}
        dom_context_dict, pair_context_dict = context_dict
        for inner, glob in zip(block.nodes(ntype).tolist(), block.ndata[dgl.NID][ntype].tolist()):
            inner_to_global_id[inner] = glob
        for src, dst in zip(block.edges()[0].tolist(), block.edges()[1].tolist()):
            if (inner_to_global_id[src], inner_to_global_id[dst]) in pair_context_dict:
                context_ids.append(pair_context_dict[(inner_to_global_id[src], inner_to_global_id[dst])])
            elif (inner_to_global_id[dst], inner_to_global_id[src]) in pair_context_dict:
                context_ids.append(pair_context_dict[(inner_to_global_id[dst], inner_to_global_id[src])])
            elif inner_to_global_id[dst] in dom_context_dict:
                context_ids.append(dom_context_dict[inner_to_global_id[dst]])
            else:
                eids = block.edge_ids(src, dst)
                block.remove_edges(eids)
        sample_graph = g.subgraph({ctype: context_ids})
        context_blocks.append(sample_graph.nodes[ctype].data)
    return context_blocks

# PyTorch의 IterableDataset 클래스를 MultiSAGE에 맞게 확장한 ItemToItemBatchSampler를 정의히는 class
class ItemToItemBatchSampler(IterableDataset):
    def __init__(self, g, user_type, item_type, batch_size):
        self.g = g
        self.user_type = user_type
        self.item_type = item_type
        self.user_to_item_etype = list(g.metagraph()[user_type][item_type])[0]
        self.item_to_user_etype = list(g.metagraph()[item_type][user_type])[0]
        self.batch_size = batch_size

    def __iter__(self):
        while True:
            heads = torch.randint(0, self.g.number_of_nodes(self.item_type), (self.batch_size,))
            result = dgl.sampling.random_walk(
                self.g,
                heads,
                metapath=[self.item_to_user_etype, self.user_to_item_etype])
            tails = result[0][:, 2]
            neg_tails = torch.randint(0, self.g.number_of_nodes(self.item_type), (self.batch_size,))
            mask = (tails != -1)
            yield heads[mask], tails[mask], neg_tails[mask]

# 그래프 데이터에서 노드 간의 이웃 샘플링을 수행하여 그래프 신경망 모델을 위한 미니배치를 생성하는 class
class NeighborSampler(object):
    def __init__(self, g, user_type, item_type, random_walk_length, random_walk_restart_prob,
                 num_random_walks, num_neighbors, num_layers):
        self.g = g
        self.user_type = user_type
        self.item_type = item_type
        self.user_to_item_etype = list(g.metagraph()[user_type][item_type])[0]
        self.item_to_user_etype = list(g.metagraph()[item_type][user_type])[0]
        self.samplers = [
            PinSAGESampler(g, item_type, user_type, random_walk_length,
                random_walk_restart_prob, num_random_walks, num_neighbors)
            for _ in range(num_layers)]

    def sample_blocks(self, seeds, heads=None, tails=None, neg_tails=None):
        blocks = []
        context_dicts = []
        for sampler in self.samplers:
            frontier, context_dict = sampler(seeds)
            if heads is not None:
                # edge ids node pointing to itself
                eids = frontier.edge_ids(torch.cat([heads, heads]), torch.cat([tails, neg_tails]), return_uv=True)[2]
                if len(eids) > 0:
                    frontier = dgl.remove_edges(frontier, eids)  # remove edge if the node pointing to itself
            block = compact_and_copy(frontier, seeds)
            seeds = block.srcdata[dgl.NID]
            blocks.insert(0, block)
            context_dicts.insert(0, context_dict)
        return blocks, context_dicts

    def sample_from_item_pairs(self, heads, tails, neg_tails):
        # Create a graph with positive connections only and another graph with negative
        pos_graph = dgl.graph(
            (heads, tails),
            num_nodes=self.g.number_of_nodes(self.item_type))
        neg_graph = dgl.graph(
            (heads, neg_tails),
            num_nodes=self.g.number_of_nodes(self.item_type))

        # remove isolated nodes and re-indexing all nodes and edges
        pos_graph, neg_graph = dgl.compact_graphs([pos_graph, neg_graph])
        seeds = pos_graph.ndata[dgl.NID]  # all node ids mapping to global graph g

        # extract 2-hop neighbor MFG structure dataset for message passing
        blocks, context_dicts = self.sample_blocks(seeds, heads, tails, neg_tails)
        return pos_graph, neg_graph, blocks, context_dicts

# 그래프 데이터와 이웃 샘플러를 활용하여 PyTorch 데이터 로더가 사용할 수 있는 형태로 데이터를 전처리하고 배치를 생성하는 class
class PinSAGECollator(object):
    def __init__(self, sampler, g, ntype, ctype):
        self.sampler = sampler
        self.ntype = ntype
        self.ctype = ctype
        self.g = g

    def collate_train(self, batches):
        # batched graph infos from item2item random walk batcher
        heads, tails, neg_tails = batches[0]

        # construct multilayer neighborhood via PinSAGE
        pos_graph, neg_graph, blocks, context_dicts = self.sampler.sample_from_item_pairs(heads, tails, neg_tails)
        context_blocks = sample_context_blocks(self.g, blocks, context_dicts, self.ntype, self.ctype)
        assign_features_to_blocks(blocks, self.g, self.ntype)

        return pos_graph, neg_graph, blocks, context_blocks

    def collate_test(self, samples):
        batch = torch.LongTensor(samples)
        blocks, context_dicts = self.sampler.sample_blocks(batch)
        context_blocks = sample_context_blocks(self.g, blocks, context_dicts, self.ntype, self.ctype)
        assign_features_to_blocks(blocks, self.g, self.ntype)

        return blocks, context_blocks

    def collate_point(self, index_id):
        point = torch.LongTensor([index_id])
        blocks, context_dicts = self.sampler.sample_blocks(point)
        context_blocks = sample_context_blocks(self.g, blocks, context_dicts, self.ntype, self.ctype)
        assign_features_to_blocks(blocks, self.g, self.ntype)

        return blocks, context_blocks

