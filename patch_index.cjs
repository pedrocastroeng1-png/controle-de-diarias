const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(
  /<link rel="icon" type="image\/x-icon" href="\/favicon.ico" \/>\s*<link rel="icon" type="image\/png" sizes="16x16" href="\/favicon-16x16.png" \/>\s*<link rel="icon" type="image\/png" sizes="32x32" href="\/favicon-32x32.png" \/>\s*<link rel="icon" type="image\/png" sizes="48x48" href="\/favicon-48x48.png" \/>/,
  '<link rel="icon" type="image/png" href="/icons/icone2.png" />'
);
content = content.replace(
  /<link rel="apple-touch-icon" href="\/apple-touch-icon.png" \/>/,
  '<link rel="apple-touch-icon" href="/icons/celular.png" />'
);
fs.writeFileSync('index.html', content);
