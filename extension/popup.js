function extractProductNumberFromURL(url) {
  const match = url.match(/\/catalog\/(\d+)\?/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', function() {
const buttonContainer = document.getElementById('buttonContainer');
const backContainer = document.getElementById('backContainer');
const tableContainer = document.getElementById('tableContainer');
const iconContainer = document.getElementById('icon-Container');
const radioButtonContainer = document.getElementById('radioButtonContainer');
const makeResultContainer = document.getElementById('makeResultContainer');

const backButton = document.getElementById('backButton');
const personalButton = document.getElementById('personalizedRecommendation'); //맞춤 추천
const makePersonalizedRecommendation = document.getElementById('makePersonalizedRecommendation');
const generalButton = document.getElementById('generalRecommendation'); //일반 추천
const iconButton1 = document.getElementById('icon1Recommendation'); //일반 추천
const iconButton2 = document.getElementById('icon2Recommendation'); //맞춤형 추천

const table = document.getElementById('resultTable');
const attribute = document.getElementsByName('attribute');

function showContent(data){

  buttonContainer.style.display = 'none';
  makeResultContainer.style.display = 'none';
  radioButtonContainer.style.display = 'none';
  iconContainer.style.display = 'none'
  backContainer.style.display = 'block';
  tableContainer.style.display = 'block';
  
  console.log
  for(let i in data){
    const new_row = table.insertRow();
    for(let j in data[i]){
      if (j === 'ID') {
        continue
      }
      const new_cell = new_row.insertCell();
      const new_item = document.createTextNode(j);
      new_cell.appendChild(new_item);
    }
    break;
  }
  for(let i in data){
    const new_row = table.insertRow();
    for(let j in data[i]){
      if (j === 'ID') {
        continue
      }
      else if (j === '상품명'){
        const new_cell = new_row.insertCell();
        const link = document.createElement('a');
        const url = `https://search.shopping.naver.com/catalog/${data[i]['ID']}?`;
        link.href = `#`; // 링크 주소를 적절하게 수정해주세요
        link.id = `link${i}`
        link.textContent = data[i][j];
        new_cell.appendChild(link);
        document.getElementById(`link${i}`).addEventListener('click', function() {
          chrome.tabs.create({ url: url });
        });
      }
      else {
        const new_cell = new_row.insertCell();
        let str = data[i][j];
        if(str.length > 100) str = str.substring(0, 100);
        const new_item = document.createTextNode(str);
        new_cell.appendChild(new_item);
      }
    }
  }
}

function makeRadiobutton(data){
  iconContainer.style.display = 'none'
  buttonContainer.style.display = 'none';
  radioButtonContainer.style.display = 'block';
  makeResultContainer.style.display = 'block';

  for(let i in data){
    for(let j in data[i]){
      var radiobox = document.createElement('input');
      radiobox.type = 'radio';
      radiobox.name = 'attribute';
      radiobox.value = data[i][j];
      console.log(data[i][j])

      var label = document.createElement('label');
      label.htmlFor = 'attribute';  // label과 input 요소를 연결

      var description = document.createTextNode(data[i][j]);
      label.appendChild(description);
   
      radioButtonContainer.appendChild(radiobox);
      radioButtonContainer.appendChild(label);
    }
  }
}

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
            showContent(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }
    }
  });
});
iconButton1.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const currentURL = currentTab.url;
      const productNumber = extractProductNumberFromURL(currentURL);

      if (productNumber) {
        fetch(`http://localhost:5000/get_ESGItem/${productNumber}`)
          .then(response => response.json())
          .then(data => {
            showContent(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }
    }
  });
});
iconButton2.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const currentURL = currentTab.url;
      const productNumber = extractProductNumberFromURL(currentURL);

      if (productNumber) {
        fetch(`http://localhost:5000/get_attribute/${productNumber}`)
          .then(response => response.json())
          .then(data => {
            makeRadiobutton(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }
    }
  });
});
personalButton.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const currentURL = currentTab.url;
      const productNumber = extractProductNumberFromURL(currentURL);

      if (productNumber) {
        fetch(`http://localhost:5000/get_attribute/${productNumber}`)
          .then(response => response.json())
          .then(data => {
            makeRadiobutton(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
    }
  });
});

makePersonalizedRecommendation.addEventListener('click', function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    if (currentTab && currentTab.url) {
      const currentURL = currentTab.url;
      const productNumber = extractProductNumberFromURL(currentURL);
      attribute.forEach((node) => {
        if(node.checked)  {
          checkNode = node.value;
          console.log(checkNode)
        }
      }) 
      const encodedCheckNode = encodeURIComponent(checkNode);
      const addNumbers = productNumber.toString() + '&' + checkNode
      console.log(addNumbers)

      if (productNumber || checkNode != '없음') {
        fetch(`http://localhost:5000/get_esg_item_personal/${addNumbers}`)
          .then(response => response.json())
          .then(data => {
            showContent(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }

      else if (productNumber || checkNode == '없음') {
        fetch(`http://localhost:5000/get_ESGItem/${productNumber}`)
          .then(response => response.json())
          .then(data => {
            showContent(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }
    }
  });
});

backButton.addEventListener('click', function() {
  backContainer.style.display = 'none';
  tableContainer.style.display = 'none';
  makeResultContainer.style.display = 'none';
  buttonContainer.style.display = 'block';
  iconContainer.style.display = 'block'

  const table_r_count = table.rows.length;
  for(let i = 0; i <= table_r_count; i++){
    table.deleteRow(-1);
  }
  const children = radioButtonContainer.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.tagName !== 'INPUT' || child.value !== 'none') {
      radioButtonContainer.removeChild(child);
  }
}
});
});