const fs = require('fs');
let sw = fs.readFileSync('src/sw.ts', 'utf-8');
// Remove top level skipWaiting and clientsClaim
sw = sw.replace(/\/\/ 3\. skipWaiting and clients\.claim\nself\.skipWaiting\(\);\nclientsClaim\(\);/, '');
fs.writeFileSync('src/sw.ts', sw);
console.log('Fixed sw.ts');
