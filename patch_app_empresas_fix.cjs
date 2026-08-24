const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// replace the first occurence if it was added twice
content = content.replace(
  "import OwnerEmpresas from './pages/owner/Empresas';\nimport OwnerEmpresas from './pages/owner/Empresas';",
  "import OwnerEmpresas from './pages/owner/Empresas';"
);

fs.writeFileSync('src/App.tsx', content);
