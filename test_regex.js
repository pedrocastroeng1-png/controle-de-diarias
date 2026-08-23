const wordToNumber = {
  'um': 1, 'uma': 1, 'dois': 2, 'duas': 2, 'tres': 3, 'três': 3,
  'quatro': 4, 'cinco': 5, 'seis': 6, 'sete': 7, 'oito': 8, 'nove': 9,
  'dez': 10, 'vinte': 20, 'trinta': 30, 'quarenta': 40, 'cinquenta': 50,
  'sessenta': 60, 'setenta': 70, 'oitenta': 80, 'noventa': 90, 'cem': 100
};
let text = "comprei uma bota";
Object.keys(wordToNumber).forEach(word => {
  const regex = new RegExp(`\\b${word}\\b`, 'g');
  text = text.replace(regex, wordToNumber[word].toString());
});
console.log(text);
