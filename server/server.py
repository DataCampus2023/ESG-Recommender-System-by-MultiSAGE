from flask import Flask, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import torch
import dgl
from urllib.parse import unquote
from scipy import spatial 
from model import MultiSAGEModel
from sampler import ItemToItemBatchSampler, NeighborSampler, PinSAGECollator
import ast  

df1 = pd.read_excel('../multisage/dataset/data.xlsx')

df2 = pd.read_excel('../multisage/dataset/ESG/ESG Score.xlsx')
df2 = df2.rename(columns={'기업명':'제조사'})
attribute_df = pd.read_excel('../multisage/dataset/attribute_df.xlsx')

g = dgl.load_graphs('../multisage/dataset/graph_data.dgl')[0][0]
saved_npz = np.load('../multisage/dataset/h_items.npz')
load_dict = torch.load('../multisage/dataset/MultiSAGE_weights.pth')
h_item = saved_npz['item_vectors']
tree = spatial.KDTree(h_item.tolist())

entities = df1['ID'].astype('category')
m_entities = entities.cat.reorder_categories(df1['ID'].values)

model = MultiSAGEModel(g, '상품', '특징', 512, 2, 3)
model.load_state_dict(load_dict)

batch_sampler = ItemToItemBatchSampler(g, '특징', '상품', 512)
neighbor_sampler = NeighborSampler(
    g, '특징', '상품', 2, 0.5, 10, 5, 2)
collator = PinSAGECollator(neighbor_sampler, g, '상품', '특징')

index_id_to_ID = {idx: ID for idx, ID in enumerate(m_entities)}
ID_to_index_id = {ID: idx for idx, ID in enumerate(m_entities)}
app = Flask(__name__)
CORS(app)

@app.route('/get_ESGItem/<productNumber>', methods=['GET'])
def get_esg_item(productNumber):
    E_Score = float(request.args.get('E_Score'))
    S_Score = float(request.args.get('S_Score'))
    G_Score = float(request.args.get('G_Score'))
    
    h_query = h_item[ID_to_index_id[int(productNumber)]]
    index_ids = tree.query(h_query, 100)[1]
    IDs = [index_id_to_ID[idx] for idx in index_ids]

    df3 = df1[df1['ID'].isin(IDs)]
    df3 = df3[df3['상품 카테고리 소분류'] == df1[df1['ID'] == int(productNumber)]['상품 카테고리 소분류'].values[0]]
    
    grade_scores = {
        'S': 10,
        1: 5,
        'A+': 8.5,
        'A': 7.0,
        'B+': 5.5,
        'B': 4,
        'C': 2.5,
        'D': 1,
        '-': 0,
        'X': 0,
        0: 0
    }

    df3 = df3.reset_index()
    df3['E_Grade'] = df3['제조사'].map(df2.set_index('제조사')['환경']).fillna('X')
    df3['S_Grade'] = df3['제조사'].map(df2.set_index('제조사')['사회']).fillna('X')
    df3['G_Grade'] = df3['제조사'].map(df2.set_index('제조사')['지배구조']).fillna('X')
    
    df3['친환경'] = df3['특징'].str.contains('비건').astype(int)
    
    df3['ESG_Score'] = (
        df3['E_Grade'].map(grade_scores) * E_Score +
        df3['S_Grade'].map(grade_scores) * S_Score +
        df3['G_Grade'].map(grade_scores) * G_Score
    ).clip(0, 10) + df3['친환경'].map(grade_scores)

    sorted_df = df3.sort_values(by='ESG_Score', ascending=False).head()
    sorted_df = sorted_df.reset_index()
    sorted_df = sorted_df[['이미지','상품명', 'ID', '특징', 'ESG_Score', 'E_Grade', 'S_Grade', 'G_Grade','친환경']]
    
    return sorted_df.to_json(orient="index")

@app.route('/get_attribute/<productNumber>', methods=['GET'])
def get_attribute(productNumber):
    E_Score = float(request.args.get('E_Score'))
    S_Score = float(request.args.get('S_Score'))
    G_Score = float(request.args.get('G_Score'))
    attribute = ast.literal_eval(df1[df1['ID'] == int(productNumber)]['특징'].values[0])
    attribute_df = pd.DataFrame(attribute, columns=['attribute'])
    return attribute_df.to_json(orient="index")

@app.route('/get_ESGItem_personal/<addNumbers>', methods=['GET'])
def get_esg_item_personal(addNumbers):
    E_Score = float(request.args.get('E_Score'))
    S_Score = float(request.args.get('S_Score'))
    G_Score = float(request.args.get('G_Score'))
    
    addNumbers = addNumbers.split('&')
    product_number = addNumbers[0]
    attribute = unquote(addNumbers[1])
    index_id = ID_to_index_id[int(product_number)]
    context_id = int(attribute_df[attribute_df['특징'] == attribute]['id'].values[0])
    with torch.no_grad():
        blocks, context_blocks = collator.collate_point(index_id=index_id)
        context_batch = model.get_representation(blocks, context_blocks, context_id)
    
    index_ids = tree.query(context_batch.numpy()[0], 100)[1]
    IDs = [index_id_to_ID[idx] for idx in index_ids]

    df3 = df1[df1['ID'].isin(IDs)]
    df3 = df3[df3['상품 카테고리 소분류'] == df1[df1['ID'] == int(product_number)]['상품 카테고리 소분류'].values[0]]
    
    grade_scores = {
        'S': 10,
        1: 5,
        'A+': 8.5,
        'A': 7.0,
        'B+': 5.5,
        'B': 4,
        'C': 2.5,
        'D': 1,
        '-': 0,
        'X': 0,
        0: 0
    }

    df3 = df3.reset_index()
    df3['E_Grade'] = df3['제조사'].map(df2.set_index('제조사')['환경']).fillna('X')
    df3['S_Grade'] = df3['제조사'].map(df2.set_index('제조사')['사회']).fillna('X')
    df3['G_Grade'] = df3['제조사'].map(df2.set_index('제조사')['지배구조']).fillna('X')
    
    df3['친환경'] = df3['특징'].str.contains('비건').astype(int)
    
    df3['ESG_Score'] = (
        df3['E_Grade'].map(grade_scores) * E_Score +
        df3['S_Grade'].map(grade_scores) * S_Score +
        df3['G_Grade'].map(grade_scores) * G_Score
    ).clip(0, 10) + df3['친환경'].map(grade_scores)

    sorted_df = df3.sort_values(by='ESG_Score', ascending=False).head()
    sorted_df = sorted_df.reset_index()
    sorted_df = sorted_df[['이미지','상품명', 'ID', '특징', 'ESG_Score', 'E_Grade', 'S_Grade', 'G_Grade','친환경']]
    
    return sorted_df.to_json(orient="index")
    

if __name__ == '__main__':
    #여기에 미리 불르고 global
    app.run(host='localhost', port=5000, debug=True)