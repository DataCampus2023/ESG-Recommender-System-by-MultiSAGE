function extractProductNumberFromURL(url) {
    const match = url.match(/\/catalog\/(\d+)\?/);
    return match ? match[1] : null;
  }
  
  document.addEventListener('DOMContentLoaded', function() {
  const buttonContainer = document.getElementById('buttonContainer');
  const tableContainer = document.getElementById('tableContainer');
  const radioButtonContainer = document.getElementById('radioButtonContainer');
  const makeResultContainer = document.getElementById('makeResultContainer');
  
  const backButton = document.getElementById('backbutton');
  const generalButton = document.getElementById('generalRecommendation'); //일반 추천
  const personalButton = document.getElementById('personalizedRecommendation'); //맞춤 추천
  const makePersonalizedRecommendation = document.getElementById('makePersonalizedRecommendation');
  
  const table = document.getElementById('resultTable');
  const attribute = document.getElementsByName('attribute');
  
  function showContent(data){
    buttonContainer.style.display = 'none';
    makeResultContainer.style.display = 'none';
    radioButtonContainer.style.display = 'none';
    tableContainer.style.display = 'block';
    
    for (let i in data) {
      const new_row = table.insertRow();
  
      for (let j in data[i]) {
        if (j === 'ID' || j ==='E_Grade'|| j=== 'S_Grade'|| j=== 'G_Grade' || j === '친환경') {
          continue;
        }
        const new_cell = document.createElement('th');
        const new_item = document.createTextNode(j);
        new_cell.appendChild(new_item);
        new_row.appendChild(new_cell)
      }
      break;
    }
  
    for (let i in data) {
      const new_row = table.insertRow();
      const hoverRow = table.insertRow(); // 여분의 행
      let scoreContent = ''
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
        else if (j==='이미지'){
          const new_cell = new_row.insertCell();
          const link = document.createElement('img');
          link.src = data[i][j];
          new_cell.appendChild(link);
        }
        else if (j === 'E_Grade' || j === 'S_Grade' || j === 'G_Grade') {
          scoreContent = scoreContent + j + ': ' + data[i][j] + ', ';
        }
        else if (j ==='친환경'){
          if (data[i][j]===0){
            scoreContent = scoreContent + j + ': ' + 'X';
          }
          else {
            scoreContent = scoreContent + j + ': ' + 'O';
          }
        }
        else if(j==='특징'){
          const new_cell = new_row.insertCell();
          let str = data[i][j];
          str = str.replace(/^\[|\'|\]$/g, '');
          str = str.replace(/\'\s*,\s*\'/g, ', ');
          if(str.length > 100) str = str.substring(0, 100);
          const new_item = document.createTextNode(str);
          new_cell.appendChild(new_item);
        }
        else {
          const new_cell = new_row.insertCell();
          let str = data[i][j];
          if(str.length > 100) str = str.substring(0, 100);
          const new_item = document.createTextNode(str);
          new_cell.appendChild(new_item);
        }
      }
      const hoverCell = document.createElement('td');
      hoverCell.textContent = scoreContent;
      hoverCell.setAttribute('colspan',4)
      hoverRow.appendChild(hoverCell)
      hoverRow.style.display = 'none'; // 여분의 행은 기본적으로 숨김 처리
      hoverRow.style.backgroundColor = '#e0f2fe';
    
      // 호버 시 여분의 행 표시
      new_row.addEventListener('mouseover', function () {
        hoverRow.style.display = 'table-row';
      });
    
      // 호버를 벗어날 때 여분의 행 숨김
      new_row.addEventListener('mouseout', function () {
        hoverRow.style.display = 'none';
      });
    }
  }
  
  function makeRadiobutton(data){
    buttonContainer.style.display = 'none';
    radioButtonContainer.style.display = 'block';
    makeResultContainer.style.display = 'block';
  
    for(let i in data){
      for(let j in data[i]){
        var radiobox = document.createElement('input');
        radiobox.type = 'radio';
        radiobox.name = 'attribute';
        radiobox.value = data[i][j];
  
        var label = document.createElement('label');
        label.htmlFor = 'attribute';  // label과 input 요소를 연결
  
        var description = document.createTextNode(data[i][j]);
        var lineBreak = document.createElement('br'); // 줄바꿈 요소 추가
        label.appendChild(description);
     
        radioButtonContainer.appendChild(radiobox);
        radioButtonContainer.appendChild(label);
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
            checkNode = node.value;
            console.log(checkNode)
          }
        }) 
        const encodedCheckNode = encodeURIComponent(checkNode);
        const addNumbers = productNumber.toString() + '&' + checkNode
        console.log(addNumbers)
  
        if (productNumber && checkNode != '없음') {
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

        radioButtonContainer.removeChild(child);
        
    }
    });
  });