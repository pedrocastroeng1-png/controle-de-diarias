const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

content = content.replace(
  '<div className="relative z-10 flex flex-col h-full justify-center md:justify-start">',
  '<div className="relative z-10 flex flex-col flex-1 justify-center md:justify-start">'
);

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');
