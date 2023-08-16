document.addEventListener('DOMContentLoaded', () => {
    const returnButton = document.querySelector('button:nth-child(3)');

returnButton.addEventListener('click', () => {
    window.location.href = '../html/popup.html'; // 맞춤 추천 페이지로 이동
  });
});