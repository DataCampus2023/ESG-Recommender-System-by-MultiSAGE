from final import get_ESGItem
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from scipy import spatial 

df1 = pd.read_excel('df.xlsx')
# '+'가 들어가 있는 행 제거
df1 = df1[~df1['상품명'].str.contains('\+')]
# '세트'가 들어가 있는 행 제거
df1 = df1[~df1['상품명'].str.contains('세트')]
df1.drop_duplicates(subset='상품명', keep='first', inplace=True)

df2 = pd.read_excel('ESG Score.xlsx')
df2 = df2.rename(columns={'기업명':'제조사'})

saved_npz = np.load('h_items_haircare_0815.npz')
h_item = saved_npz['movie_vectors']
tree = spatial.KDTree(h_item.tolist())

entities = df1['ID'].astype('category')
m_entities = entities.cat.reorder_categories(df1['ID'].values)

index_id_to_ID = {idx: ID for idx, ID in enumerate(m_entities)}
ID_to_index_id = {ID: idx for idx, ID in enumerate(m_entities)}
app = Flask(__name__)
CORS(app)

# @app.route('/get_recommendations', methods=['POST'])
# @app.route('/get_ESGItem/<product_number>', methods=['GET'])

# def get_esg_item(product_number):
#     try:
#         # Call your final.py's get_ESGItem function with the provided product_number
#         recommendations = get_ESGItem(product_number)
#         return jsonify({'recommendations': recommendations})
#     except Exception as e:
#         return jsonify({'error': str(e)})
# @app.route('/get_ESGItem/<product_number>', methods=['OPTIONS'])
# def handle_preflight():
#     response = app.make_default_options_response()
#     response.headers['Access-Control-Allow-Origin'] = '*'
#     response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
#     response.headers['Access-Control-Allow-Headers'] = '*'
#     response.headers['Access-Control-Allow-Credentials'] = 'true'
#     return response


@app.route('/get_ESGItem/<product_number>', methods=['GET'])
def get_esg_item(product_number):
    # try:
    #     data = request.get_json()
    #     product_number = data.get('product_number')
    #     if product_number:
    #         recommendations = get_ESGItem(product_number)
    #         return jsonify({'recommendations': recommendations})
    #     else:
    #         return jsonify({'error': 'Product number not provided'})
    # except Exception as e:
    #     return jsonify({'error': str(e)})
    try:
        h_query = h_item[ID_to_index_id[product_number]]
        index_ids = tree.query(h_query, 100)[1]
        IDs = [index_id_to_ID[idx] for idx in index_ids]
    except KeyError:
        raise KeyError(f"Product item {product_number} not found in the index.")

    
    # h_query = h_item[ID_to_index_id[product_item]]
    # index_ids = tree.query(h_query, 100)[1]
    # IDs = [index_id_to_ID[idx] for idx in index_ids]

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
    sorted_df = sorted_df[['상품명', '특징', 'ESG_Score']]
    # sorted_df.to_excel('recommend.xlsx')

    return sorted_df.to_json()

    response = jsonify({})
    response.headers.add("Access-Control-Allow-Origin", request.headers.get("Origin"))
    response.headers.add("Access-Control-Request-Methods", "GET, POST, PUT, DELETE")
    response.headers.add("Access-Control-Allow-Headers", "Origin, Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization")
    response.headers.add("Access-Control-Max-Age", "60")
    response.headers.add("Access-Control-Allow-Credentials", "true")
    response.headers.add("Access-Control-Expose-Headers", "Content-Length")

    if request.headers.get("Referer") == request.headers.get("Origin"):
        # Origin과 Referer가 일치하는 경우에만 처리
        product_number = request.json.get('product_number')
        # final.py의 get_ESGItem 함수 호출 및 결과 반환
        # recommendations = get_ESGItem(product_number)
        response = jsonify({"id":product_number})

    return response

if __name__ == '__main__':
    #여기에 미리 불르고 global

    app.run(host='localhost', port=5000, debug=True)
    



