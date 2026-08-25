const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace(/\)\)\);/g, '));');
code = code.replace(/\)\)\)/g, '))'); // just in case
code = code.replace(/\)\)\)\)/g, ')))');
fs.writeFileSync('src/lib/api.ts', code);
