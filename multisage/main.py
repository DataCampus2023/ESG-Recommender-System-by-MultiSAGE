import argparse
import pickle

import numpy as np
import torch

from model import train


if __name__ == '__main__':
    # Arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--graph_file_path', type=str, default='graph_data.pickle')
    parser.add_argument('--random-walk-length', type=int, default=2)
    parser.add_argument('--random-walk-restart-prob', type=float, default=0.5)
    parser.add_argument('--num-random-walks', type=int, default=10)
    parser.add_argument('--num-neighbors', type=int, default=5)
    parser.add_argument('--num-layers', type=int, default=2)
    parser.add_argument('--gat-num-heads', type=int, default=3)
    parser.add_argument('--hidden-dims', type=int, default=512)
    parser.add_argument('--batch-size', type=int, default=256)
    parser.add_argument('--device', type=str, default='cpu')
    parser.add_argument('--num-epochs', type=int, default=100) # 4
    parser.add_argument('--batches-per-epoch', type=int, default=25) # 5000
    parser.add_argument('--num-workers', type=int, default=0)
    parser.add_argument('--lr', type=float, default=1e-4) # 원래는 0.00001
    parser.add_argument('-k', type=int, default=10)
    args = parser.parse_args()

    # Load dataset
    with open('dataset/graph_data.pickle', 'rb') as f:
        dataset = pickle.load(f)
    model, h_item = train(dataset, args)

    # Write files
    torch.save(model.state_dict(), 'dataset/MultiSAGE_weights_test.pth')
    np.savez("h_items_test.npz", item_vectors=h_item.numpy())
