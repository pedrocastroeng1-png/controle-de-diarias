const fs = require('fs');
let content = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

content = content.replace(
  'w-[100px] sm:w-[120px] md:w-[210px] lg:w-[240px] xl:w-[280px]',
  'w-[130px] sm:w-[150px] md:w-[210px] lg:w-[240px] xl:w-[280px]'
);

fs.writeFileSync('src/pages/auth/Login.tsx', content, 'utf8');
