const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.{ts,tsx,js,jsx}');
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  if (content.includes('/logo.png')) {
    if (file.includes('Login.tsx') || file.includes('Layout.tsx') && content.includes('h-24 w-24')) {
      content = content.replace(/\/logo\.png/g, '/pceg-logo.png');
    } else {
      content = content.replace(/\/logo\.png/g, '/pceg-icone.png');
    }
    changed = true;
  }
  
  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated logos in ${file}`);
  }
}
