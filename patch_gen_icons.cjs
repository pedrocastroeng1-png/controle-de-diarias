const fs = require('fs');
let code = fs.readFileSync('scripts/generate-icons.js', 'utf8');
code = code.replace(/'icons\/icone\.png'/g, "'icons/icone2.png'");
fs.writeFileSync('scripts/generate-icons.js', code);
