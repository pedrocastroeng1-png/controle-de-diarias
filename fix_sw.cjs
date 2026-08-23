const fs = require('fs');
let swContent = fs.readFileSync('src/sw.ts', 'utf8');

swContent = swContent.replace(/icon: '\/icons\/icone2.png'/g, "icon: '/icons/celular.png'");
swContent = swContent.replace(/badge: '\/icons\/icone2.png'/g, "badge: '/icons/celular.png'");

fs.writeFileSync('src/sw.ts', swContent);
