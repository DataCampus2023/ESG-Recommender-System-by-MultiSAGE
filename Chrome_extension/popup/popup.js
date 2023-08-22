function extractProductNumberFromURL(url) {
  const match = url.match(/\/catalog\/(\d+)\?/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', function() {
const header = document.getElementById('header');
const radioButtonHeader = document.getElementById('radioButtonHeader');
const buttonContainer = document.getElementById('buttonContainer');
const backContainer = document.getElementById('backContainer');
const tableContainer = document.getElementById('tableContainer');
const radioButtonContainer = document.getElementById('radioButtonContainer');
const makeResultContainer = document.getElementById('makeResultContainer');

const backButton = document.getElementById('backButton');
const personalButton = document.getElementById('personalizedRecommendation'); //맞춤 추천
const makePersonalizedRecommendation = document.getElementById('makePersonalizedRecommendation');
const generalButton = document.getElementById('generalRecommendation'); //일반 추천

const table = document.getElementById('resultTable');
const attribute = document.getElementsByName('attribute');

function showContent(data){

  header.style.display = 'none';
  radioButtonHeader.style.display = 'none';
  buttonContainer.style.display = 'none';
  makeResultContainer.style.display = 'none';
  radioButtonContainer.style.display = 'none';
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
  header.style.display = 'none';
  buttonContainer.style.display = 'none';
  radioButtonContainer.style.display = 'block';
  makeResultContainer.style.display = 'block';
  radioButtonHeader.style.display = 'flex';

  for (let i in data) {
    for (let j in data[i]) {
      var radiobox = document.createElement('input');
      radiobox.type = 'radio';
      radiobox.name = 'attribute';
      radiobox.value = data[i][j];

      var label = document.createElement('label');
      label.htmlFor = 'attribute';
  
      var description = document.createTextNode(data[i][j]);

      var lineBreak = document.createElement('br'); // 줄바꿈 요소 추가
      label.appendChild(description);
      radioButtonContainer.appendChild(radiobox)
      radioButtonContainer.appendChild(label); // 새로운 div를 radioButtonContainer에 추가
      radioButtonContainer.appendChild(lineBreak);
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
          chackNodes = node.value;
        }
      }) 
      const addNumbers = productNumber.toString() + '&' + chackNodes
      console.log(addNumbers)

      if (productNumber && chackNodes !== '없음') {
        fetch(`http://localhost:5000/get_ESGItem_personal/${addNumbers}`)
          .then(response => response.json())
          .then(data => {
            showContent(data);
          })
          .catch(error => {
            console.error('Error:', error);
          });
          console.log('성공!')
      }

      else if (productNumber && chackNodes === '없음') {
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
  header.style.display = 'flex';
  radioButtonHeader.style.display = 'none';
  buttonContainer.style.display = 'block';

  const table_r_count = table.rows.length;
  for(let i = 0; i <= table_r_count; i++){
    table.deleteRow(-1);
  }
  const children = radioButtonContainer.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];

    radioButtonContainer.removeChild(child);
    
}
});
});
