function extractProductNumberFromURL(url) {
  const match = url.match(/\/catalog\/(\d+)\?/);
  return match ? match[1] : null;
}

document.addEventListener('DOMContentLoaded', function() {
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

  buttonContainer.style.display = 'none';
  makeResultContainer.style.display = 'none';
  radioButtonContainer.style.display = 'none';
  backContainer.style.display = 'block';
  tableContainer.style.display = 'block';
  

  for(let i in data){
    const new_row = table.insertRow();
    for(let j in data[i]){
      const new_cell = new_row.insertCell();
      const new_item = document.createTextNode(j);
      new_cell.appendChild(new_item);
    }
    break;
  }
  for(let i in data){
    const new_row = table.insertRow();
    for(let j in data[i]){
      const new_cell = new_row.insertCell();
      let str = data[i][j];
      if(str.length > 20) str = str.substring(0, 20);
      const new_item = document.createTextNode(str);
      new_cell.appendChild(new_item);
    }
  }
}

function makeRadiobutton(data){

  buttonContainer.style.display = 'none';
  radioButtonContainer.style.display = 'block';
  makeResultContainer.style.display = 'block';

  console.log(data)
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

      if (productNumber | chackNodes != '없음') {
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

      else if (productNumber | chackNodes == '없음') {
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
