document.addEventListener('DOMContentLoaded', function() {
  const buttonContainer = document.getElementById('buttonContainer');
  const contentContainer = document.getElementById('contentContainer');
  const generalContent = document.getElementById('generalContent');
  const personalizedContent = document.getElementById('personalizedContent');
  const backButton = document.getElementById('backButton');
  
  const generalButton = document.getElementById('generalRecommendation');
  const personalizedButton = document.getElementById('personalizedRecommendation');

  // URL에서 숫자 추출하는 함수
  function extractProductNumberFromURL(url) {
    const match = url.match(/\/catalog\/(\d+)\?/);
    return match ? match[1] : null;
  }

  // 현재 탭의 URL 가져오는 함수
  function getCurrentTabURL(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];
      callback(tab.url);
    });
  }

  // 제품 번호 확인을 위한 코드 추가
  getCurrentTabURL(function(url) {
    // const productNumberFromURL = extractProductNumberFromURL(url);
    // console.log('Extracted Product Number:', productNumberFromURL);

    // generalButton.addEventListener('click', function() {
    //   if (productNumberFromURL) {
    //     generalContent.textContent = `일반 추천 내용 - 제품 번호: ${productNumberFromURL}`;
    //   } else {
    //     generalContent.textContent = "일반 추천 내용을 표시합니다.";
    //   }
    //   buttonContainer.style.display = 'none';
    //   contentContainer.style.display = 'block';
    //   generalContent.style.display = 'block';
    //   personalizedContent.style.display = 'none'; // 이 부분 추가
    //   backButton.style.display = 'block';
    // });
    const productNumberFromURL = extractProductNumberFromURL(url);
    console.log('Extracted Product Number:', productNumberFromURL);

    generalButton.addEventListener('click', function() {
      if (productNumberFromURL) {
        generalContent.textContent = `일반 추천 내용 - 제품 번호: ${productNumberFromURL}`;
      } else {
        generalContent.textContent = "일반 추천 내용을 표시합니다.";
      }
      buttonContainer.style.display = 'none';
      contentContainer.style.display = 'block';
      generalContent.style.display = 'block';
      personalizedContent.style.display = 'none';
      backButton.style.display = 'block';

      if (productNumberFromURL) {
        // 웹 서버에 제품 번호를 전달하고 추천 정보를 가져오기
        fetch('http://localhost:5000/get_recommendations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ product_number: productNumberFromURL })
        })
        .then(response => response.json())
        .then(data => {
          // 추천 정보를 화면에 표시하는 코드 추가
          const recommendations = data.recommendations;
          const recommendationList = document.createElement('ul');
          for (const recommendation of recommendations) {
            const recommendationItem = document.createElement('li');
            recommendationItem.textContent = recommendation.name;
            recommendationList.appendChild(recommendationItem);
          }
          generalContent.appendChild(recommendationList);
        })
        .catch(error => console.error(error));
      }
    });


    personalizedButton.addEventListener('click', function() {
      if (productNumberFromURL) {
        personalizedContent.textContent = `맞춤형 추천 내용 - 제품 번호: ${productNumberFromURL}`;
      } else {
        personalizedContent.textContent = "맞춤형 추천 내용을 표시합니다.";
      }
      buttonContainer.style.display = 'none';
      contentContainer.style.display = 'block';
      personalizedContent.style.display = 'block';
      generalContent.style.display = 'none'; // 이 부분 추가
      backButton.style.display = 'block';
    });
  });

  backButton.addEventListener('click', function() {
    buttonContainer.style.display = 'block';
    contentContainer.style.display = 'none';
    generalContent.style.display = 'none';
    personalizedContent.style.display = 'none';
    backButton.style.display = 'none';
  });
});
