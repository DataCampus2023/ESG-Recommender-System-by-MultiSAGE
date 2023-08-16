document.addEventListener('DOMContentLoaded', () => {
    const generalRecommendationButton = document.querySelector('button:nth-child(1)');
    const customRecommendationButton = document.querySelector('button:nth-child(2)');
  
    generalRecommendationButton.addEventListener('click', () => {
        window.location.href = '../html/recommendation.html'; // 일반 추천 페이지로 이동
    });
  
    customRecommendationButton.addEventListener('click', () => {
        window.location.href = '../html/recommendation.html'; // 일반 추천 페이지로 이동
    });
  });
  