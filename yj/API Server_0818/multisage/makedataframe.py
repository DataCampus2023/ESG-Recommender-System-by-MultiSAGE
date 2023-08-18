#!/usr/bin/env python
# coding: utf-8

# In[1]:


from requests import request
from requests.compat import *
from bs4 import BeautifulSoup
# from user_agent import generate_user_agent
import pandas as pd
import math
import time

def CrawlCategoryId(category_id, filename='categoryId.csv'):
    url = 'https://search.shopping.naver.com/search/category/' 
    headers = {'User-Agent': 'Yeti',}
    params = {
        'pagingIndex' : '1',
        'pagingSize' : '80',
        'productSet' : 'model'
    }
    resp = request('GET',url=url+str(category_id), headers=headers)
    print(resp.request.url)

    dom = BeautifulSoup(resp.text, 'html.parser')
    script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
    data = json.loads(script_tag.text)

    title_value_pairs = [{'title': x['title'], 'value': x['value']} for x in data['props']['pageProps']['initialState']['mainFilters'][0]['filterValues']]
    category_df = pd.DataFrame(title_value_pairs)

    rows_to_drop = []
    rows_to_append = []

    for index, row in category_df.iterrows():
        category_url = url + str(row['value'])
        time.sleep(0.3)
        resp = request('GET',url=category_url,params=params, headers=headers)
        print(resp.request.url)
        dom = BeautifulSoup(resp.text, 'html.parser')
        script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
        data = json.loads(script_tag.text)

        if data['props']['pageProps']['initialState']['subFilters']:
            product_count = data['props']['pageProps']['initialState']['subFilters'][0]['filterValues'][1]['productCount']
        else:
            product_count = 0

        if int(product_count)/int(params['pagingSize']) > 100:
            print(row['title'], row['value'], product_count, product_count/int(params['pagingSize']))
            rows_to_drop.append(index)
            sub_title_value_pairs = [{'title': x['title'], 'value': x['value']} for x in data['props']['pageProps']['initialState']['mainFilters'][0]['filterValues']]
            rows_to_append += sub_title_value_pairs

    # Drop the rows from original DataFrame
    category_df = category_df.drop(rows_to_drop)

    # Append new rows to DataFrame
    category_df = category_df.append(rows_to_append, ignore_index=True)

    category_df.to_csv(filename, index=False, encoding='utf-8-sig')
    
    return list(category_df['value'])


# In[2]:


def makePageDF(category_id, page_id, pagingsize):
    url = 'https://search.shopping.naver.com/search/category/' + str(category_id)
    params = {
        'pagingIndex' : str(page_id),
        'pagingSize' : str(pagingsize),
        'productSet' : 'model'
    }
    headers = {'User-Agent': 'Yeti',}
    resp = request('GET',url=url, params=params, headers=headers)
    print(resp.request.url)
    dom = BeautifulSoup(resp.text, 'html.parser')
    script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
    data = json.loads(script_tag.text)
    itemList = data['props']['pageProps']['initialState']['products']
    
    
    # 각 상품의 정보를 저장할 리스트를 생성합니다.
    products_info = []

    for item in itemList['list'][:80]:

        attributes_dict = dict()
        # 'attributeValue'와 'characterValue' 문자열을 리스트로 분리합니다.
        attribute_values = item['item'].get('attributeValue','').split('|')
        character_values = item['item'].get('characterValue','').split('|')

        # 'attributeValue' 리스트의 각 요소에서 '_M' 문자열을 제거합니다.
        attribute_values = [value.replace('_M', '') for value in attribute_values]

        min_len = min(len(attribute_values), len(character_values))

        for j in range(min_len):
            attribute = attribute_values[j]
            character = character_values[j]

            if attribute in attributes_dict:
                attributes_dict[attribute].append(character)
            else:
                attributes_dict[attribute] = [character]

        attribute_list = [item['item']['category3Name']]

        for i in attributes_dict:
            if i not in ['용량', '구성', '']:
                attribute_list = attribute_list + attributes_dict[i]
            else:
                continue

        dict_data = {
            'ID': item['item']['id'],
            '상품명': item['item']['productName'],
            '상품 카테고리 대분류': item['item']['category1Name'],
            '상품 카테고리 중분류': item['item']['category2Name'],
            '상품 카테고리 소분류': item['item']['category3Name'],
            '제조사': item['item'].get('maker',''),
            '브랜드': item['item'].get('brand',''),
            '특징': attribute_list
        }
        for attribute in attribute_list:
            dict_data[attribute] = True

        products_info.append(dict_data)

    total = data['props']['pageProps']['initialState']['products']['total']
    total_page = math.ceil(total/int(params['pagingSize']))
        
        # 딕셔너리의 리스트를 데이터프레임으로 변환합니다.
    df = pd.DataFrame(products_info)
    
    return df,total_page

def makeCategoryDF(category_id):
    
    category_id_list = CrawlCategoryId(category_id)
    
    df = pd.DataFrame()
        
    
    for k in category_id_list:
        for j in [20,40,60,80]:
            new_df,total_page = makePageDF(k,1,j)
            if total_page >1:
                for i in range(2,total_page+1):
                    new_df, _ = makePageDF(k,i,j)
                    time.sleep(0.3)
                    df = pd.concat([df, new_df], ignore_index=True)
    
    df = df.drop_duplicates(subset=['ID'])

    df = pd.DataFrame(df).astype({'제조사': 'category'})
    df = pd.DataFrame(df).astype({'브랜드': 'category'})

    attribute_columns = df.columns.drop(['ID', '상품명', '상품 카테고리 대분류', '상품 카테고리 중분류','상품 카테고리 소분류','제조사','브랜드','특징'])
    df[attribute_columns] = df[attribute_columns].fillna(False).astype('bool')
    
    small_df = df.explode('특징')[['ID','상품명','특징']]
    attributes = pd.DataFrame(small_df['특징'].unique()).reset_index()
    attributes.columns = ['attribute_id', '특징']
    attributes = pd.DataFrame(attributes).astype({'attribute_id': 'category'})
    merged_df = pd.merge(small_df, attributes, on=['특징'])
    
    return df, merged_df, attributes

