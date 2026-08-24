const fs = require('fs');
const content = fs.readFileSync('dist/assets/index-D1mATYuC.js', 'utf8');
const match = content.match(/.{0,20}bcrypt.{0,20}/i);
console.log(match ? match[0] : "NOT FOUND");
