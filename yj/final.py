#!/usr/bin/env python
# coding: utf-8

# In[2]:


import pandas as pd
import numpy as np
from scipy import spatial

def get_ESGItem(product_item):
    df1 = pd.read_excel('C:/Users/KYJ2/Desktop/ESG-Recommender-System-by-MultiSAGE/dataset/Haircare/df.xlsx')
    df1 = df1[~df1['상품명'].str.contains('[+]|\세트')]
    df1.drop_duplicates(subset='상품명', keep='first', inplace=True)

    df2 = pd.read_excel('C:/Users/KYJ2/Desktop/ESG-Recommender-System-by-MultiSAGE/dataset/ESG/ESG Score.xlsx')
    df2 = df2.rename(columns={'기업명':'제조사'})

    saved_npz = np.load('C:/Users/KYJ2/Desktop/ESG-Recommender-System-by-MultiSAGE/yj/multisage/h_items_haircare_0815.npz')
    h_item = saved_npz['movie_vectors']
    tree = spatial.KDTree(h_item.tolist())

    entities = df1['ID'].astype('category')
    m_entities = entities.cat.reorder_categories(df1['ID'].values)

    index_id_to_ID = {idx: ID for idx, ID in enumerate(m_entities)}
    ID_to_index_id = {ID: idx for idx, ID in enumerate(m_entities)}
    
    h_query = h_item[ID_to_index_id[product_item]]
    index_ids = tree.query(h_query, 100)[1]
    IDs = [index_id_to_ID[idx] for idx in index_ids]

    df3 = df1[df1['ID'].isin(IDs)]
    
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

    sorted_df = df3.sort_values(by='ESG_Score', ascending=False).head()
    
    sorted_df.to_excel('recommend.xlsx')
    return sorted_df

