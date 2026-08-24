const fs = require('fs');
const files = fs.readdirSync('dist/assets');
for (const file of files) {
  const content = fs.readFileSync('dist/assets/' + file, 'utf8');
  if (content.toLowerCase().includes('bcrypt')) {
    console.log(file + ' contains bcrypt!');
    const idx = content.toLowerCase().indexOf('bcrypt');
    console.log(content.substring(Math.max(0, idx - 50), idx + 50));
  }
}
