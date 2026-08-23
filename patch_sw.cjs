const fs = require('fs');

let sw = fs.readFileSync('src/sw.ts', 'utf8');
sw = sw.replace(/controle-diarias-v/g, 'pceg-v');
sw = sw.replace(/\/icons\/icone\.png/g, '/icons/icone2.png');
fs.writeFileSync('src/sw.ts', sw);
