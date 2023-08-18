// 메시지 수신 및 처리
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getESGItem') {
    // 현재 활성 탭 정보 얻기
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url) {
        // 현재 탭의 URL을 content script로 보내서 데이터 추출하도록 지시
        chrome.scripting.executeScript(
          {
            target: { tabId: currentTab.id },
            function: handleGeneralRecommendationClick
          },
          function(result) {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError);
              return;
            }
          }
        );
      }
    });
  } else if (request.action === 'setESGItemData') {
    // 추천 데이터를 받아 팝업 스크립트에 전달
    chrome.action.setPopup({
      popup: 'popup.html'
    });

    // 추천 데이터를 content script로 전달
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      function: setContent,
      args: [request.data]
    });
  }
});

// 추천 데이터를 content.js에 설정하는 함수
function setContent(data) {
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
