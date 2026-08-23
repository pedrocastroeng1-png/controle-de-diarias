const fs = require('fs');

const files = [
  'src/pages/debug/Debug.tsx',
  'src/components/CommunicationViewer.tsx',
  'src/contexts/AuthContext.tsx',
  'src/main.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\/icons\/icone\.png/g, '/icons/icone2.png');
    fs.writeFileSync(file, content);
    console.log("Patched " + file);
  }
}
