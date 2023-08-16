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
      personalizedContent.style.display = 'none'; // 이 부분 추가
      backButton.style.display = 'block';
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
