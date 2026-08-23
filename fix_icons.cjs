const fs = require('fs');

// 1. Update scripts/generate-icons.js
let genIcons = fs.readFileSync('scripts/generate-icons.js', 'utf8');
genIcons = genIcons.replace(
  "const FAVICON_PATH = path.join(PUBLIC_DIR, 'icons/icone2.png');",
  "const FAVICON_PATH = path.join(PUBLIC_DIR, 'icons/celular.png');"
);
genIcons = genIcons.replace(
  "console.log(\"Generating icons from celular.png and icone.png...\");",
  "console.log(\"Generating icons from celular.png...\");"
);
fs.writeFileSync('scripts/generate-icons.js', genIcons);

// 2. Update index.html favicon link
let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
  '<link rel="icon" type="image/png" href="/icons/icone2.png" />',
  '<link rel="icon" type="image/png" href="/favicon-32x32.png" />'
);
fs.writeFileSync('index.html', indexHtml);

