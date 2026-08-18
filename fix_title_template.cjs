const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

code = code.replace(
  "// Normalize empty strings to null for optional fields (if they allow null)\n    if (!payload.title_template) payload.title_template = ''; // or null if your DB requires it, but string is usually safe. Wait, the req says \"title_template pode continuar string vazia se o schema permitir.\" ",
  "// Normalize empty strings\n    if (!payload.title_template) payload.title_template = '';"
);

fs.writeFileSync('src/pages/admin/AutomationsForm.tsx', code, 'utf-8');
