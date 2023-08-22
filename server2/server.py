from flask import Flask
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

df1 = pd.read_excel('data.xlsx')
# '+'가 들어가 있는 행 제거
# df1 = df1[~df1['상품명'].str.contains('\+')]
# '세트'가 들어가 있는 행 제거
# df1 = df1[~df1['상품명'].str.contains('세트')]
# df1.drop_duplicates(subset='상품명', keep='first', inplace=True)

df2 = pd.read_excel('ESG Score.xlsx')
df2 = df2.rename(columns={'기업명':'제조사'})
attribute_df = pd.read_excel('attribute_df.xlsx')

g = dgl.load_graphs('beauty_data_except_perfume.dgl')[0][0]
saved_npz = np.load('Beauty_h_items.npz')
load_dict = torch.load('Beauty_MultiSAGE_weights.pth')
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

@app.route('/get_ESGItem/<product_number>', methods=['GET'])
def get_esg_item(product_number):
    h_query = h_item[ID_to_index_id[int(product_number)]]
    index_ids = tree.query(h_query, 100)[1]
    IDs = [index_id_to_ID[idx] for idx in index_ids]
    # try:
    #     h_query = h_item[ID_to_index_id[product_number]]
    #     index_ids = tree.query(h_query, 100)[1]
    #     IDs = [index_id_to_ID[idx] for idx in index_ids]
    # except KeyError:
    #     IDs = []
    #raise 리턴을 넣던지 except를 
    # 또는 다른 에러 처리 방식을 선택할 수 있습니다.
    # 예를 들어, IDs = [] 처럼 빈 리스트로 설정할 수 있습니다.
    df3 = df1[df1['ID'].isin(IDs)]
    df3 = df3[df3['상품 카테고리 소분류'] == df1[df1['ID'] == int(product_number)]['상품 카테고리 소분류'].values[0]]
    
    grade_scores = {
        'S': 10,
        'A+': 8.8,
        'A': 8.0,
        'A-': 7.2,
        'B+': 6.4,
        'B': 5.6,
        'B-': 4.8,
        'C+': 4.0,
        'C': 3.2,
        'C-': 2.4,
        'D+': 1.6,
        'D': 0.8,
        '-': 0,
        'X': 0
    }

    df3 = df3.reset_index()
    df3['E_Grade'] = df3['제조사'].map(df2.set_index('제조사')['환경']).fillna('X')
    df3['S_Grade'] = df3['제조사'].map(df2.set_index('제조사')['사회']).fillna('X')
    df3['G_Grade'] = df3['제조사'].map(df2.set_index('제조사')['지배구조']).fillna('X')
    
    df3['Vegan'] = df3['특징'].str.contains('비건').astype(int)
    
    df3['ESG_Score'] = (
        df3['E_Grade'].map(grade_scores) * 0.4 +
        df3['S_Grade'].map(grade_scores) * 0.2 +
        df3['G_Grade'].map(grade_scores) * 0.1 +
        df3['Vegan'] * 0.3
    ).clip(0, 10)

    sorted_df = df3.sort_values(by='ESG_Score', ascending=False).head(7)
    sorted_df = sorted_df.reset_index()
    sorted_df = sorted_df[['상품명', 'ID', '특징', 'ESG_Score']]
    
    return sorted_df.to_json(orient="index")

@app.route('/get_attribute/<product_number>', methods=['GET'])
def get_attribute(product_number):
    attribute = ast.literal_eval(df1[df1['ID'] == int(product_number)]['특징'].values[0])
    attribute_df = pd.DataFrame(attribute, columns=['attribute'])
    return attribute_df.to_json(orient="index")

@app.route('/get_esg_item_personal/<addNumbers>', methods=['GET'])
def get_esg_item_personal(addNumbers):
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
        'A+': 8.8,
        'A': 8.0,
        'A-': 7.2,
        'B+': 6.4,
        'B': 5.6,
        'B-': 4.8,
        'C+': 4.0,
        'C': 3.2,
        'C-': 2.4,
        'D+': 1.6,
        'D': 0.8,
        '-': 0,
        'X': 0
    }

    df3 = df3.reset_index()
    df3['E_Grade'] = df3['제조사'].map(df2.set_index('제조사')['환경']).fillna('X')
    df3['S_Grade'] = df3['제조사'].map(df2.set_index('제조사')['사회']).fillna('X')
    df3['G_Grade'] = df3['제조사'].map(df2.set_index('제조사')['지배구조']).fillna('X')
    
    df3['Vegan'] = df3['특징'].str.contains('비건').astype(int)
    
    df3['ESG_Score'] = (
        df3['E_Grade'].map(grade_scores) * 0.4 +
        df3['S_Grade'].map(grade_scores) * 0.2 +
        df3['G_Grade'].map(grade_scores) * 0.1 +
        df3['Vegan'] * 0.3
    ).clip(0, 10)

    sorted_df = df3.sort_values(by='ESG_Score', ascending=False).head(5)
    sorted_df = sorted_df.reset_index()
    sorted_df = sorted_df[['상품명', 'ID', '특징', 'ESG_Score']]

    return sorted_df.to_json(orient="index")
    

if __name__ == '__main__':
    #여기에 미리 불르고 global
    app.run(host='localhost', port=5000, debug=True)