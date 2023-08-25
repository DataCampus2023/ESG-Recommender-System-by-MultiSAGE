function extractProductNumberFromURL(url) {
  const match = url.match(/\/catalog\/(\d+)\?/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', function () {
  const backContainer = document.getElementById('backContainer');
  const iconContainer = document.getElementsByClassName('icon-Container')[0];
  const dropdownButtonContainer = document.getElementById('radioButtonContainer');
  const itemContainer = document.getElementsByClassName('item-container')[0];
  const resultContainer = document.getElementsByClassName('result-container')[0];
  const fitRecommendContainer = document.getElementsByClassName('fit-recommend-container')[0];
  
  const backButton = document.getElementById('backButton');
  const makePersonalizedRecommendation = document.getElementById('makePersonalizedRecommendation');
  const iconButton1 = document.getElementById('icon1Recommendation'); //일반 추천 버튼
  const iconButton2 = document.getElementById('icon2Recommendation'); //맞춤형 추천 버튼
  const leftButton = document.getElementById('left-button'); 
  const rightButton = document.getElementById('right-button'); 
  const itemImg = document.getElementById('item-img');
  const itemName= document.getElementById('item-name');
  const itemESGscore= document.getElementsByClassName('item-ESGscore')[1];
  const itemFeatures= document.getElementsByClassName('item-features')[1];


  let itemNum = 0;
  let itemMaxNum = 0;
  let responseData ={};

  function handleImageClick() {
    const url = `https://search.shopping.naver.com/catalog/${responseData[itemNum]['ID']}`;
    chrome.tabs.create({ url: url });
  }

  function showContent(data,i) {

    fitRecommendContainer.style.display ='none';
    iconContainer.style.display = 'none'
    backContainer.style.display = 'block';
    itemContainer.style.display = 'block';
    resultContainer.style.display ='flex';
    
    console.log(itemNum,itemMaxNum);
    
    const url = `https://search.shopping.naver.com/catalog/${data[i]['ID']}`;
    fetch(url)
    .then((response) => response.text()) // HTML 응답을 텍스트로 가져옵니다.
    .then((html) => {
      const parser = new DOMParser(); // DOMParser 객체를 생성합니다.
      const doc = parser.parseFromString(html, 'text/html'); // HTML 문자열을 DOM 객체로 변환합니다.
      const scriptContent = doc.getElementById('__NEXT_DATA__').textContent; // id가 '__NEXT_DATA__'인 요소의 텍스트 내용을 가져옵니다.
      
      // JSON 데이터를 파싱합니다. JSON 형식이 올바르다고 가정하면:
      const jsonData = JSON.parse(scriptContent);
      imgSrc = jsonData.props.pageProps.ogTag.image;
      itemImg.src = imgSrc;
      // 기존 이벤트 리스너 제거
      itemImg.removeEventListener('click', handleImageClick);

      // 새로운 이벤트 리스너 등록
      itemImg.addEventListener('click', handleImageClick);
      itemName.textContent = data[i].상품명
      itemESGscore.textContent = data[i].ESG_Score
      
      let features = data[i].특징;
      features = features.replace(/^\[|\'|\]$/g, ''); // 대괄호와 작은따옴표 제거
      features = features.replace(/\'\s*,\s*\'/g, ', '); // 쉼표 앞뒤의 작은따옴표와 공백 제거
      itemFeatures.textContent = features;

    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
  }

  function makeDropdownbutton(data) {
    iconContainer.style.display = 'none';
    fitRecommendContainer.style.display = 'block';
    
    // 기존 드롭다운 버튼이 있다면 제거
    var existingDropdown = dropdownButtonContainer.querySelector('select[name="attribute"]');
    if (existingDropdown) {
      dropdownButtonContainer.removeChild(existingDropdown);
    }
  
    // select 요소 생성
    var dropdown = document.createElement('select');
    dropdown.name = 'attribute';
    
    for (let i in data) {
      for (let j in data[i]) {
        // option 요소 생성
        var option = document.createElement('option');
        option.value = data[i][j];
        option.text = data[i][j];
        dropdown.appendChild(option); // select 요소에 option 추가
      }
    }
    // 라벨 요소 선택
    var label = document.getElementById('dropdownLabel');
  
    // select 요소를 라벨 앞에 추가
    dropdownButtonContainer.insertBefore(dropdown, label);
  }
  

  iconButton1.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const currentURL = currentTab.url;
        const productNumber = extractProductNumberFromURL(currentURL);

        if (productNumber) {
          fetch(`http://localhost:5000/get_ESGItem/${productNumber}`)
            .then(response => response.json())
            .then(data => {
              responseData = data;
              itemMaxNum = Object.keys(data).length;
              showContent(data,0);
            })
            .catch(error => {
              console.error('Error:', error);
            });
          console.log('성공!')
        }
      }
    });
  });

  iconButton2.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const currentURL = currentTab.url;
        const productNumber = extractProductNumberFromURL(currentURL);

        if (productNumber) {
          fetch(`http://localhost:5000/get_attribute/${productNumber}`)
            .then(response => response.json())
            .then(data => {
              responseData = data;
              itemMaxNum = Object.keys(data).length;
              makeDropdownbutton(data);
            })
            .catch(error => {
              console.error('Error:', error);
            });
          console.log('성공!')
        }
      }
    });
  });

  leftButton.addEventListener('click',function (){
    if( itemNum === 0){
      itemNum = itemMaxNum-1;
      showContent(responseData,itemNum)
    } else{
      itemNum = itemNum -1;
      showContent(responseData,itemNum)
    }
  });

  rightButton.addEventListener('click',function (){
    if( itemNum+1 === itemMaxNum){
      itemNum = 0;
      showContent(responseData,itemNum)
    } else{
      itemNum = itemNum + 1;
      showContent(responseData,itemNum)
    }
  });

  makePersonalizedRecommendation.addEventListener('click', function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        const currentURL = currentTab.url;
        const productNumber = extractProductNumberFromURL(currentURL);
        const dropdown = document.querySelector('select[name="attribute"]'); // 클래스 또는 ID에 맞게 선택자 변경
        const checkNode = dropdown.value; // 선택된 값
        const addNumbers = productNumber.toString() + '&' + checkNode
        console.log(addNumbers)

        if (productNumber) {
          fetch(`http://localhost:5000/get_ESGItem_personal/${addNumbers}`)
            .then(response => response.json())
            .then(data => {
              responseData = data;
              itemMaxNum = Object.keys(data).length;
              showContent(data,0);
            })
            .catch(error => {
              console.error('Error:', error);
            });
          console.log('성공!')
        }
      }
    });
  });

  backButton.addEventListener('click', function () {
    backContainer.style.display = 'none';
    fitRecommendContainer.style.display ='none';
    itemContainer.style.display = 'none';
    resultContainer.style.display = 'none';
    iconContainer.style.display = 'flex';
  });
});

