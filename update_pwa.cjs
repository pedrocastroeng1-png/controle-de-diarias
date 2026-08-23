const fs = require('fs');

// 1. Update index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

// Ensure apple-mobile-web-app-title is present
if (!indexHtml.includes('apple-mobile-web-app-title')) {
  indexHtml = indexHtml.replace(
    '<title>PCEG — Gestão de Obras</title>',
    '<title>PCEG — Pedro Castro Engenharia e Gestão</title>\n    <meta name="apple-mobile-web-app-title" content="PCEG" />\n    <meta name="application-name" content="PCEG" />'
  );
}

// Make sure apple-touch-icon points to /icons/celular.png
if (!indexHtml.includes('<link rel="apple-touch-icon" href="/icons/celular.png" />')) {
  indexHtml = indexHtml.replace(
    /<link rel="apple-touch-icon".*?\/>/,
    '<link rel="apple-touch-icon" href="/icons/celular.png" />'
  );
}

fs.writeFileSync('index.html', indexHtml);

// 2. Update vite.config.ts
let viteConfig = fs.readFileSync('vite.config.ts', 'utf8');
viteConfig = viteConfig.replace(
  'name: "PCEG — Gestão de Obras",',
  'name: "PCEG — Pedro Castro Engenharia e Gestão",'
);
fs.writeFileSync('vite.config.ts', viteConfig);
