const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import OwnerAtualizacoes from './pages/owner/Atualizacoes';",
  "import OwnerAtualizacoes from './pages/owner/Atualizacoes';\nimport OwnerEmpresas from './pages/owner/Empresas';"
);

content = content.replace(
  "<Route path=\"empresas\" element={<Placeholder title=\"Empresas\" />} />",
  "<Route path=\"empresas\" element={<OwnerEmpresas />} />"
);

fs.writeFileSync('src/App.tsx', content);
