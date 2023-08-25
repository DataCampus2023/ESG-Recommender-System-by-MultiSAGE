# ESG-Recommender-System-by-MultiSAGE
MultiSAGE를 이용한 ESG 반영 추천시스템

1. Chrome_extension, Chrome_extension_2, Chrome_extension_3

    최종 결과물인 크롬 확장 프로그램입니다. 총 3가지 디자인으로 되어있으며, 설정 - 확장 프로그램 - 개발자 모드 - '압축해제된
    확장 프로그램을 로드합니다.' 를 클릭해 해당 폴더명을 클릭하면 설치 가능합니다.
    
    첫 번째 확장 프로그램은 Box 형태로 상품 추천을 표현하고자 했습니다. 때문에 UI가 모두 사각형 형태로 구성되어 있고, 상품 추천 페이지는
    한 번에 모든 상품들을 볼 수 있도록 표로 구성되어 있습니다.

    두 번째 확장 프로그램은 Carousel 형태로 상품 추천을 표현하고자 했습니다. 추천된 상품들이 Carousel 형태로 표시되기 때문에 상품 각각에 더
    집중해서 볼 수 있습니다.

    세 번째 확장 프로그램은 Block 형태로 상품 추천을 표현하고자 했습니다. 때문에 첫 번째 확장 프로그램에서 색이나 장식들을 배제하고 Block 형태로 표현하고자 했습니다.


2. multisage
    
    자료 수집/전처리/그래프 생성을 위한 preprocessor.py, builder.py 와 모델 학습에 필요한 layers.py, main.py, model.py, newpinsage.py,
    sampler.py로 구성되어 있습니다.

    builder.py는 Dataframe을 dgl 형식의 그래프로 바꿔주는 class를 가진 모듈입니다. 이 모듈을 통해 그래프의 노드와 엣지를 생성합니다.

    preprocessor.py는 특정 카테고리 ID를 입력하면 그 카테고리 안에 있는 상품들 전부를 웹에서 데이터를 수집 후 전처리, 그래프 생성을 하는 모듈입니다. 카테고리 ID를 입력 후 이 파이썬 파일을 실행하면 해당 카테고리 안에 있는 상품들을 전부 스크래핑한 다음 전처리된 DB와 그래프 파일을 각각 엑셀 형식과 dgl, pickle 형식으로 내보내서 dataset 폴더에 저장합니다.

    layers.py는 그래프 학습 시 사용하는 layers에 대해 정의한 모듈입니다. MultiSAGE는 GAT, PinSAGE 등 다양한 패키지에서 나온 layers를 사용해서 학습하기 때문에 이런 모듈들이 정의되어 있습니다.

    modal.py는 학습 결과로 나온 npz 파일과 pth 파일을 이용해 MultiSAGE 모델을 실행시킬 수 있는 Class와 모델을 학습하기 위한 학습 함수가 정의되어 있는 모듈입니다. 학습 함수에서는 매 epoch마다 loss를 저장해 학습이 완료되면 자동으로 Learning Curve를 출력하고 h_item과 학습된 model을 반환합니다.

    main.py는 그래프 학습을 실행시키기 위한 모듈로 그래프 학습에 필요한 hyperparameter와 학습 후 각 노드별 가중치와 이웃에 대한 정보가 저장된 npz 파일과 pth 파일을 dataset 폴더에 저장시킵니다. dataset 폴더에 preprocessor.py에서 만든 graph_data.pickle 파일이 있어야 학습이 가능합니다.

    newpinsage.py는 dgl 모듈에 정의된 Pinsage 모듈을 MultiSAGE에 맞게 수정한 코드입니다. PinSAGE에서 활용하는 Random Walk 방식의 이웃 지정에 MultiSAGE에서 활용하는 Edge와 Node Type 또한 같이 처리할 수 있도록 수정했습니다.

    sampler.py는 newpinsage.py를 포함해 그래프 학습 시 sampling을 하기 위한 모듈로, MultiSAGE 학습에 필요한 형태로 sampling을 진행합니다.

3. server

    Chrome Extension이 추천 정보를 받아오는 로컬 서버가 정의되어 있는 폴더입니다. server.py를 실행하면 multisage/dataset에 있는 DB와 그래프 파일, 특징에 대한 DB, 학습 결과로 나온 npz 파일과 pth 등을 미리 로드를 해서 추천 결과를 보여주는 시간을 단축하고자 했습니다. 로컬 서버는 Port 5000에서 실행되도록 설정되어 있습니다.

현재 이 프로그램은 압축을 풀면 바로 실행될 수 있도록 file path가 설정되어 있습니다. 만약 여러 이유 등으로 엑셀 파일이나 npz 파일이나 pth, dgl, pickle 파일이 손상되었다면 multisage/dataset/backup에 원데이터들을 저장했으니 필요하다면 여기서 데이터를 복사하시면 됩니다.

    


