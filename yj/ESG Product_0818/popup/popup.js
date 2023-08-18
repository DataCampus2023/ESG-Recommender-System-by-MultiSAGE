// document.addEventListener('DOMContentLoaded', function() {
//   const buttonContainer = document.getElementById('buttonContainer');
//   const contentContainer = document.getElementById('contentContainer');
//   const generalContent = document.getElementById('generalContent');
//   const personalizedContent = document.getElementById('personalizedContent');
//   const backButton = document.getElementById('backButton');
  
//   const generalButton = document.getElementById('generalRecommendation');
//   const personalizedButton = document.getElementById('personalizedRecommendation');

//   function extractProductNumberFromURL(url) {
//     const match = url.match(/\/catalog\/(\d+)\?/);
//     return match ? match[1] : null;
//   }

//   function getCurrentTabURL(callback) {
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//       const tab = tabs[0];
//       callback(tab.url);
//     });
//   }

//   getCurrentTabURL(function(url) {
//     const productNumberFromURL = extractProductNumberFromURL(url);
//     console.log('Extracted Product Number:', productNumberFromURL);

//     generalButton.addEventListener('click', function() {
//       if (productNumberFromURL) {
//         generalContent.textContent = `일반 추천 내용 - 제품 번호: ${productNumberFromURL}`;
//       } else {
//         generalContent.textContent = "일반 추천 내용을 표시합니다.";
//       }
//       buttonContainer.style.display = 'none';
//       contentContainer.style.display = 'block';
//       generalContent.style.display = 'block';
//       personalizedContent.style.display = 'none';
//       backButton.style.display = 'block';

//       if (productNumberFromURL) {
//         fetch('http://localhost:5000/get_recommendations', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ product_number: productNumberFromURL })
//         })
//         .then(response => response.json())
//         .then(data => {
//           const recommendations = data.recommendations;
//           const recommendationList = document.createElement('ul');
//           for (const recommendation of recommendations) {
//             const recommendationItem = document.createElement('li');
//             recommendationItem.textContent = recommendation.name;
//             recommendationList.appendChild(recommendationItem);
//           }
//           generalContent.appendChild(recommendationList);
//         })
//         .catch(error => console.error(error));
//       }
//     });

//     personalizedButton.addEventListener('click', function() {
//       if (productNumberFromURL) {
//         personalizedContent.textContent = `맞춤형 추천 내용 - 제품 번호: ${productNumberFromURL}`;
//       } else {
//         personalizedContent.textContent = "맞춤형 추천 내용을 표시합니다.";
//       }
//       buttonContainer.style.display = 'none';
//       contentContainer.style.display = 'block';
//       personalizedContent.style.display = 'block';
//       generalContent.style.display = 'none';
//       backButton.style.display = 'block';
//     });
//   });

//   backButton.addEventListener('click', function() {
//     buttonContainer.style.display = 'block';
//     contentContainer.style.display = 'none';
//     generalContent.style.display = 'none';
//     personalizedContent.style.display = 'none';
//     backButton.style.display = 'none';
//   });
  
//   // 클릭 이벤트 추가
//   chrome.action.onClicked.addListener(function(tab) {
//     chrome.scripting.executeScript(
//       {
//         target: { tabId: tab.id },
//         function: extractProductNumber
//       },
//       function(result) {
//         if (chrome.runtime.lastError) {
//           console.error(chrome.runtime.lastError);
//           return;
//         }
//         const productNumber = result[0].result.productNumber;
//         if (productNumber) {
//           console.log('Product Number:', productNumber);
//           // 백그라운드 스크립트로 제품 번호 전달
//           chrome.runtime.sendMessage({ action: 'getESGItem', productNumber: productNumber });
//         } else {
//           console.log('Product number not found.');
//         }
//       }
//     );
//   });
// });
function extractProductNumberFromURL(url) {
  const match = url.match(/\/catalog\/(\d+)\?/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', function() {
const buttonContainer = document.getElementById('buttonContainer');
const contentContainer = document.getElementById('contentContainer');
const generalContent = document.getElementById('generalContent');
const personalizedContent = document.getElementById('personalizedContent');
const backButton = document.getElementById('backButton');

const generalButton = document.getElementById('generalRecommendation');
const personalizedButton = document.getElementById('personalizedRecommendation');

generalButton.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const currentURL = currentTab.url;
      const productNumber = extractProductNumberFromURL(currentURL);

      if (productNumber) {
        fetch(`http://localhost:5000/get_ESGItem/${productNumber}`)
          .then(response => response.json())
          .then(data => {
            chrome.scripting.executeScript(
              {
                target: { tabId: currentTab.id },
                function: setContent,
                args: [data]
              },
              function(result) {
                if (chrome.runtime.lastError) {
                  console.error(chrome.runtime.lastError);
                  return;
                }
                showContent('generalContent');
              }
            );
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
    }
  });
});

personalizedButton.addEventListener('click', function() {
  // 맞춤형 추천 버튼 클릭 시, content.js에 메시지를 보냄
  chrome.runtime.sendMessage({ action: 'getPersonalizedESGItem' });
});

backButton.addEventListener('click', function() {
  contentContainer.style.display = 'none';
  buttonContainer.style.display = 'block';
  generalContent.style.display = 'none';
  personalizedContent.style.display = 'none';
  backButton.style.display = 'none';
});
});
