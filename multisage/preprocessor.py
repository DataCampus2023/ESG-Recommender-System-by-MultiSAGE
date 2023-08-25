from requests import request
from requests.compat import *
from bs4 import BeautifulSoup
import dgl
import pickle
import pandas as pd
import math
import time
import requests
import torch
import numpy as np
import pandas as pd
import math
from builder import PandasGraphBuilder
import ast

def makePageDF(category_id, page_id, pagingsize):

    max_attempts = 3  # Maximum number of attempts to fetch data from a page
    attempts = 0

    while attempts < max_attempts:
        try:
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

            if script_tag:
                data = json.loads(script_tag.text)
                itemList = data['props']['pageProps']['initialState']['products']


                # 각 상품의 정보를 저장할 리스트를 생성합니다.
                products_info = []

                for item in itemList['list'][:pagingsize]:

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
                        '특징': attribute_list,
                        '느낌': item['item'].get('atmtTag','').replace('|',',').split(','),
                        '평점': item['item'].get('scoreInfo',0),
                    }

                    products_info.append(dict_data)

                total = data['props']['pageProps']['initialState']['products']['total']
                total_page = math.ceil(total/int(params['pagingSize']))

                    # 딕셔너리의 리스트를 데이터프레임으로 변환합니다.
                df = pd.DataFrame(products_info)

                return df,total_page
            else:
                attempts += 1
                print("script_tag not found on page", page_id)
                time.sleep(1)  # Wait for a short time before retrying
        except requests.exceptions.RequestException as e:
            attempts += 1
            print("Request Exception:", e)
            time.sleep(1)  # Wait for a short time before retrying
        except (ValueError, KeyError, AttributeError, TypeError) as e:
            attempts += 1
            print("Error while processing data:", e)
            time.sleep(1)  # Wait for a short time before retrying

    print(f"Failed to fetch data for page {page_id} after {max_attempts} attempts.")
    return None, None


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


def makeCategoryDF(category_id):

    category_id_list = CrawlCategoryId(category_id)
    dfs = []  # 데이터프레임을 저장할 리스트를 생성합니다.

    for j in [60,80]:
        for k in category_id_list:
            new_df,total_page = makePageDF(k,1,j)
            dfs.append(new_df)  # 데이터프레임을 리스트에 추가합니다.
            if total_page > 1:
                for i in range(2,total_page+1):
                    new_df, _ = makePageDF(k,i,j)
                    time.sleep(0.3)
                    dfs.append(new_df)  # 데이터프레임을 리스트에 추가합니다.
            else:
                continue

    # 중복이 제거된 데이터프레임을 다시 불러와서 하나의 데이터프레임으로 합칩니다.
    df = pd.concat(dfs, ignore_index=True)

    df = df.drop_duplicates(subset=['ID'])
    df = df.drop_duplicates(subset=['상품명','제조사'])
    df = df.drop_duplicates(subset=['상품명','브랜드'], ignore_index=True)

    df = pd.DataFrame(df).astype({'제조사': 'category'})
    df = pd.DataFrame(df).astype({'브랜드': 'category'})

    return df



def add_attribute(df,name):
    if name == '성분':
        ingredients_list = []
        for item in df['ID']:
            try:
                url = 'https://search.shopping.naver.com/catalog/' + str(item)
                headers = {'User-Agent': 'Yeti',}
                resp = request('GET',url=url,headers=headers)
                print(resp.request.url)
                dom = BeautifulSoup(resp.text, 'html.parser')
                script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
                data = json.loads(script_tag.text)

                ingredients = data['props']['pageProps']['initialState']['catalog']['cosmeticIngredient'].get('allIngredients','')
                if ingredients:
                    ingredients = ingredients.replace(' ','').split(',')
                ingredients_list.append(ingredients)
                time.sleep(0.5)

            except requests.exceptions.RequestException as e:
                print("Request Exception:", e)
                print("Retrying for item:", item)
                ingredients = []
                ingredients_list.append(ingredients)
                continue

            except (ValueError, KeyError, AttributeError,TypeError) as e:
                print("Error while processing data:", e)
                print("Retrying for item:", item)
                ingredients = []
                ingredients_list.append(ingredients)
                continue

        df[name] = ingredients_list

    elif name == '네이버 추천 상품 ID':
        recommend_item_id_list = []
        for item in df['ID']:
            try:
                url = 'https://search.shopping.naver.com/catalog/' + str(item)
                headers = {'User-Agent': 'Yeti',}
                resp = request('GET',url=url,headers=headers)
                print(resp.request.url)
                dom = BeautifulSoup(resp.text, 'html.parser')
                script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
                data = json.loads(script_tag.text)
                recommend_item = data['props']['pageProps']['initialState']['catalog']['recommend']['explore']['recItems']
                recommend_item_id = []
                for i in range(len(recommend_item)):
                    if recommend_item[i]['nPayMblType'] == '0':
                        recommend_item_id.append(recommend_item[i]['nvMid'])
                    else:
                        continue
                recommend_item_id_list.append(recommend_item_id)
                time.sleep(0.5)

            except requests.exceptions.RequestException as e:
                print("Request Exception:", e)
                print("Retrying for item:", item)
                recommend_item_id = []
                ingredients_list.append(recommend_item_id)
                continue

            except (ValueError, KeyError, AttributeError,TypeError) as e:
                print("Error while processing data:", e)
                print("Retrying for item:", item)
                recommend_item_id = []
                ingredients_list.append(recommend_item_id)
                continue

        df[name] = recommend_item_id_list
        
    elif name == '이미지':
        url_list = []
        for item in df['ID']:
            try:
                url = 'https://search.shopping.naver.com/catalog/' + str(item)
                headers = {'User-Agent': 'Yeti',}
                resp = request('GET',url=url,headers=headers)
                print(resp.request.url)
                dom = BeautifulSoup(resp.text, 'html.parser')
                script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
                data = json.loads(script_tag.text)
                url = data['props']['pageProps']['ogTag']['image'].replace('f160','f80')
                url_list.append(url)
                time.sleep(0.5)

            except requests.exceptions.RequestException as e:
                print("Request Exception:", e)
                print("Retrying for item:", item)
                url = ''
                url_list.append(url)
                continue

            except (ValueError, KeyError, AttributeError,TypeError) as e:
                print("Error while processing data:", e)
                print("Retrying for item:", item)
                url = ''
                url_list.append(url)
                continue

        df[name] = url_list
        
    elif name == '최저가':
        price_list = []
        for item in df['ID']:
            try:
                url = 'https://search.shopping.naver.com/catalog/' + str(item)
                headers = {'User-Agent': 'Yeti',}
                resp = request('GET',url=url,headers=headers)
                print(resp.request.url)
                dom = BeautifulSoup(resp.text, 'html.parser')
                script_tag = dom.find("script", {"id": "__NEXT_DATA__"})
                data = json.loads(script_tag.text)
                price = data['props']['pageProps']['initialState']['catalog']['lowestPrice']
                price_list.append(price)
                time.sleep(0.5)

            except requests.exceptions.RequestException as e:
                print("Request Exception:", e)
                print("Retrying for item:", item)
                price = 0
                price_list.append(price)
                continue

            except (ValueError, KeyError, AttributeError,TypeError) as e:
                print("Error while processing data:", e)
                print("Retrying for item:", item)
                price = 0
                price_list.append(price)
                continue

        df[name] = price_list

def graph_maker(df):

    attributes_df, attributes, attributes_merged_df = seperateDF(df, '특징')
    feel_df, _, _ = seperateDF(df,'느낌')

    graph_builder = PandasGraphBuilder()
    graph_builder.add_entities(attributes, '특징_id', '특징')
    graph_builder.add_entities(df, 'ID', '상품')
    graph_builder.add_binary_relations(attributes_merged_df, '특징_id', 'ID', 'define')
    graph_builder.add_binary_relations(attributes_merged_df, 'ID', '특징_id', 'define-by')
    g = graph_builder.build()

    g.nodes['특징'].data['id'] = torch.LongTensor(attributes['특징_id'].cat.codes.values)

    attribute_columns = attributes_df.columns.drop(['ID', '상품명', '상품 카테고리 대분류', '상품 카테고리 중분류','상품 카테고리 소분류','제조사','브랜드','특징','느낌','평점','성분'])
    attributes_df[attribute_columns] = attributes_df[attribute_columns].fillna(False).astype('bool')
    g.nodes['상품'].data['특징'] = torch.FloatTensor(attributes_df[attribute_columns].values)

    attribute_columns = feel_df.columns.drop(['ID', '상품명', '상품 카테고리 대분류', '상품 카테고리 중분류','상품 카테고리 소분류','제조사','브랜드','특징','느낌','평점','성분'])
    feel_df[attribute_columns] = feel_df[attribute_columns].fillna(False).astype('bool')
    g.nodes['상품'].data['느낌'] = torch.FloatTensor(feel_df[attribute_columns].values)

    g.edges['define'].data['rating'] = torch.LongTensor(attributes_merged_df['평점'].values)
    g.edges['define-by'].data['rating'] = torch.LongTensor(attributes_merged_df['평점'].values)

    # 그래프 구조 확인

    print("Number of nodes per type:")
    print(g.number_of_nodes())
    print("Number of edges per type:")
    print(g.number_of_edges())
    print("Node types:")
    print(g.ntypes)
    print("Edge types:")
    print(g.etypes)

    # 노드 데이터 확인
    for ntype in g.ntypes:
        print(f"Node type: {ntype}")
        print(g.nodes[ntype].data)

    # 엣지 데이터 확인
    for stype, etype, dtype in g.canonical_etypes:
        print(f"Edge type: {etype}")
        print(g.edges[etype].data)

    # 그래프 구조 확인
    print("Graph structure:")
    print(g)

    return g, attributes


def seperateDF(df, name):
    df_copy = df.copy()

    small_df = df_copy.explode(name)[['ID','상품명',name,'평점']]
    attributes = pd.DataFrame(small_df[name].unique()).reset_index()
    attributes.columns = [name + '_id', name]
    attributes = pd.DataFrame(attributes).astype({name + '_id': 'category'})
    attribute_list = list(attributes[name])
    merged_df = pd.merge(small_df, attributes, on=[name])

    for i in attribute_list:
        data_list = []
        print(i)
        for j in range(len(df)):
            if i in df[name][j]:
                data_list.append(True)
            else:
                data_list.append(False)
        df_copy = pd.concat([df_copy, pd.DataFrame({i: data_list})], axis=1)

    return df_copy, attributes, merged_df




if __name__ == '__main__':

    # 데이터 수집 및 데이터 저장
    df = makeCategoryDF(100001026) # 이곳 카테고리 ID 수정! (실제 수집 카테고리 ID는 100000003, 테스트용은 100001026)
    add_attribute(df,'성분')
    add_attribute(df,'이미지')

    df.to_excel('data.xlsx')

    # 데이터 전처리
    for i in range(len(df)):
        
        new_features = []
        new_feelings = []

        for j in df['특징'][i]:
            if ', ' in j:
                new_features.extend(j.split(', '))
                for k in j.split(', '):
                    if ',' in k:
                        new_features.extend(k.split(','))
            elif ',' in j:
                new_features.extend(j.split(','))
                for k in j.split(','):
                    if ', ' in k:
                        new_features.extend(k.split(', '))
            else:
                new_features.append(j)

        for j in df['느낌'][i]:
            if ', ' in j:
                new_feelings.extend(j.split(', '))
                for k in j.split(', '):
                    if ',' in k:
                        new_feelings.extend(k.split(','))
            elif ',' in j:
                new_feelings.extend(j.split(','))
                for k in j.split(','):
                    if ', ' in k:
                        new_feelings.extend(k.split(', '))
            else:
                new_feelings.append(j)
        df.at[i, '느낌'] = new_feelings


    # 그래프 생성 및 그래프 데이터 저장
    g, attributes = graph_maker(df)

    attributes.to_excel('attribute_df.xlsx')

    output_path = 'graph_data.dgl'
    dgl.save_graphs(output_path, [g])

    dataset = {
        'train-graph': g,
        'context-type': '특징',
        'item-type': '상품',
        'context-to-item-type': 'define',
        'item-to-context-type': 'define-by'}

    with open('graph_data.pickle', 'wb') as f:
        pickle.dump(dataset, f)

