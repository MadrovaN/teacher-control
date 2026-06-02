const tips = [
  'Nezapomeň pitný režim před testem.',
  'Meme dne: pošli do drbárny něco školně safe.',
  'Když se ti hodina líbila, dej 5★ a pochvalu.',
];

byId('fun-btn').onclick = () => {
  byId('fun-text').textContent = tips[Math.floor(Math.random() * tips.length)];
};
