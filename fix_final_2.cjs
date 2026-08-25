const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');
code = code.replace(/true\)\);/g, 'true);');
code = code.replace(/`\.order\("nome"\)\);/g, '`).order("nome");');
fs.writeFileSync('src/lib/api.ts', code);
