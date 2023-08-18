// // 웹 페이지의 URL에서 제품번호 추출하는 함수
// function extractProductNumberFromURL(url) {
//   const match = url.match(/\/catalog\/(\d+)\?/);
//   return match ? match[1] : null;
// }

// // 현재 탭의 URL 추출하고 추출한 제품번호를 서버에 전송하는 함수
// function sendProductNumberToServer(url) {
//   const productNumber = extractProductNumberFromURL(url);

//   if (productNumber) {
//     fetch('http://localhost:5000/get_recommendations', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({
//         product_number: productNumber
//       })
//     })
//     .then(response => response.json())
//     .then(data => {
//       // 받아온 추천 결과 데이터 활용 및 표시 로직 작성
//       console.log(data); // 예시: 추천 결과를 콘솔에 출력
//     })
//     .catch(error => {
//       console.error('Error:', error);
//     });
//   } else {
//     console.error('Product number not found in URL.');
//   }
// }

// // 현재 페이지의 URL 추출
// const currentURL = window.location.href;

// // 추출한 제품 번호를 메시지로 전송
// chrome.runtime.sendMessage({ action: 'productNumber', productNumber: extractProductNumberFromURL(currentURL) });

// // 메시지 수신 및 제품 번호 사용
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.action === 'getESGItem') {
//     sendProductNumberToServer(request.productNumber);
//   }
// });

// 웹 페이지의 URL에서 제품번호 추출하는 함수
// function extractProductNumberFromURL(url) {
//   const match = url.match(/\/catalog\/(\d+)\?/);
//   return match ? match[1] : null;
// }

// // 현재 페이지의 URL 추출
// const currentURL = window.location.href;
// const productNumberFromURL = extractProductNumberFromURL(currentURL);

// // 메시지 수신 및 제품 번호 사용
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.action === 'getESGItem') {
//     if (productNumberFromURL) {
//       sendProductNumberToServer(productNumberFromURL, 'generalContent');
//     }
//   } else if (request.action === 'getPersonalizedESGItem') {
//     if (productNumberFromURL) {
//       sendProductNumberToServer(productNumberFromURL, 'personalizedContent');
//     }
//   }
// });

// function sendProductNumberToServer(productNumber, contentId) {
//   fetch('http://localhost:5000/get_recommendations', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({ product_number: productNumber })
//   })
//   .then(response => response.json())
//   .then(data => {
//     const contentElement = document.getElementById(contentId);
//     contentElement.innerHTML = ''; // Clear previous content
//     const recommendationList = document.createElement('ul');
//     for (const recommendation of data.recommendations) {
//       const recommendationItem = document.createElement('li');
//       recommendationItem.textContent = recommendation.name;
//       recommendationList.appendChild(recommendationItem);
//     }
//     contentElement.appendChild(recommendationList);
//     showContent(contentId);
//   })
//   .catch(error => {
//     console.error('Error:', error);
//   });
// }

// function showContent(contentId) {
//   const buttonContainer = document.getElementById('buttonContainer');
//   const contentContainer = document.getElementById('contentContainer');
//   const backButton = document.getElementById('backButton');
  
//   contentContainer.style.display = 'block';
//   buttonContainer.style.display = 'none';
//   backButton.style.display = 'block';

//   const generalContent = document.getElementById('generalContent');
//   const personalizedContent = document.getElementById('personalizedContent');

//   if (contentId === 'generalContent') {
//     generalContent.style.display = 'block';
//     personalizedContent.style.display = 'none';
//   } else if (contentId === 'personalizedContent') {
//     generalContent.style.display = 'none';
//     personalizedContent.style.display = 'block';
//   }
// }

// content.js
function setContent(data) {
  console.log('Received Recommendation Data:', data);
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'setContent') {
      const recommendationList = document.createElement('ul');
      for (const recommendation of data.recommendations) {
        const recommendationItem = document.createElement('li');
        recommendationItem.textContent = recommendation.name;
        recommendationList.appendChild(recommendationItem);
      }
      const generalContent = document.getElementById('generalContent');
      generalContent.innerHTML = '';
      generalContent.appendChild(recommendationList);
      showContent('generalContent');
    }
  });
}

// 메시지 수신 및 버튼 클릭 이벤트 등록
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getESGItem') {
    // 중간 결과 확인
    console.log('getESGItem Message Received');
    handleGeneralRecommendationClick();
  }
});

// 일반 추천 버튼 클릭 시 동작
function handleGeneralRecommendationClick() {
  // 현재 페이지의 URL 추출
  const currentURL = window.location.href;
  const productNumberFromURL = extractProductNumberFromURL(currentURL);

  if (productNumberFromURL) {
    fetchRecommendationData(productNumberFromURL);
  }
}

// 추천 데이터 요청 및 처리
function fetchRecommendationData(productNumber) {
  fetch(`http://localhost:5000/get_ESGItem/${productNumber}`)
    .then(response => response.json())
    .then(data => {
      displayRecommendationData(data);
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

// 추천 데이터 화면에 표시
function displayRecommendationData(data) {
  const recommendationList = document.createElement('ul');
  for (const recommendation of data.recommendations) {
    const recommendationItem = document.createElement('li');
    recommendationItem.textContent = recommendation.name;
    recommendationList.appendChild(recommendationItem);
  }

  const generalContent = document.getElementById('generalContent');
  generalContent.innerHTML = ''; // Clear previous content
  generalContent.appendChild(recommendationList);

  showContent('generalContent');
}

// 추천 데이터가 있는 컨텐츠를 표시
function showContent(contentId) {
  const buttonContainer = document.getElementById('buttonContainer');
  const contentContainer = document.getElementById('contentContainer');
  const backButton = document.getElementById('backButton');
  
  contentContainer.style.display = 'block';
  buttonContainer.style.display = 'none';
  backButton.style.display = 'block';

  const generalContent = document.getElementById('generalContent');
  const personalizedContent = document.getElementById('personalizedContent');

  if (contentId === 'generalContent') {
    generalContent.style.display = 'block';
    personalizedContent.style.display = 'none';
  } else if (contentId === 'personalizedContent') {
    generalContent.style.display = 'none';
    personalizedContent.style.display = 'block';
  }
}

// 버튼 클릭 이벤트 등록
document.addEventListener('DOMContentLoaded', function() {
  const generalButton = document.getElementById('generalRecommendation');
  const personalizedButton = document.getElementById('personalizedRecommendation');
  const backButton = document.getElementById('backButton');

  generalButton.addEventListener('click', function() {
    // 일반 추천 버튼 클릭 시, background.js에 메시지를 보냄
    chrome.runtime.sendMessage({ action: 'getESGItem' });
  });

  personalizedButton.addEventListener('click', function() {
    // 맞춤형 추천 버튼 클릭 시, background.js에 메시지를 보냄
    chrome.runtime.sendMessage({ action: 'getPersonalizedESGItem' });
  });

  backButton.addEventListener('click', function() {
    const buttonContainer = document.getElementById('buttonContainer');
    const contentContainer = document.getElementById('contentContainer');
    const generalContent = document.getElementById('generalContent');
    const personalizedContent = document.getElementById('personalizedContent');
  
    contentContainer.style.display = 'none';
    buttonContainer.style.display = 'block';
    generalContent.style.display = 'none';
    personalizedContent.style.display = 'none';
    backButton.style.display = 'none';
  });
});
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getESGItem') {
    handleGeneralRecommendationClick();
  }
});





