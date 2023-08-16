chrome.action.onClicked.addListener(function(tab) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: extractProductNumber
    },
    function(result) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      const productNumber = result[0].result.productNumber;
      if (productNumber) {
        console.log('Product Number:', productNumber);
        // 이제 productNumber를 활용하여 원하는 작업을 수행할 수 있습니다.
      } else {
        console.log('Product number not found.');
      }
    }
  );
});
