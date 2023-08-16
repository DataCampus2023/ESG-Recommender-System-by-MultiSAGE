// const tabs = await chrome.tabs.query({
//     url: [
//       'https://developer.chrome.com/docs/webstore/*',
//       'https://developer.chrome.com/docs/extensions/*'
//     ]
//   });
  
//   // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator
//   const collator = new Intl.Collator();
//   tabs.sort((a, b) => collator.compare(a.title, b.title));
  
//   const template = document.getElementById('li_template');
//   const elements = new Set();
//   for (const tab of tabs) {
//     const element = template.content.firstElementChild.cloneNode(true);
  
//     const title = tab.title.split('-')[0].trim();
//     const pathname = new URL(tab.url).pathname.slice('/docs'.length);
  
//     element.querySelector('.title').textContent = title;
//     element.querySelector('.pathname').textContent = pathname;
//     element.querySelector('a').addEventListener('click', async () => {
//       // need to focus window as well as the active tab
//       await chrome.tabs.update(tab.id, { active: true });
//       await chrome.windows.update(tab.windowId, { focused: true });
//     });
  
//     elements.add(element);
//   }
//   document.querySelector('ul').append(...elements);
  
//   const button = document.querySelector('button');
//   button.addEventListener('click', async () => {
//     const tabIds = tabs.map(({ id }) => id);
//     if (tabIds.length) {
//       const group = await chrome.tabs.group({ tabIds });
//       await chrome.tabGroups.update(group, { title: 'DOCS' });
//     }
//   });

// scripts/popup.js

document.addEventListener('DOMContentLoaded', () => {
  const generalRecommendationButton = document.querySelector('button:nth-child(1)');
  const customRecommendationButton = document.querySelector('button:nth-child(2)');

  generalRecommendationButton.addEventListener('click', () => {
    window.location.href = '../html/recommendation.html'; // 일반 추천 페이지로 이동
  });

  customRecommendationButton.addEventListener('click', () => {
    window.location.href = '../html/select.html'; // 맞춤 추천 페이지로 이동
  });
});
