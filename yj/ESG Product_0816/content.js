function extractData() {
  const productNumberElement = document.querySelector('.info ._2EoubPD6sD');
  if (productNumberElement) {
    return productNumberElement.textContent.trim();
  }
  return null;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'extractProductNumber') {
    const productNumber = extractData();
    sendResponse(productNumber);
  }
});
