const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import OwnerAuditoria from './pages/owner/Auditoria';",
  "import OwnerAuditoria from './pages/owner/Auditoria';\nimport OwnerAtualizacoes from './pages/owner/Atualizacoes';"
);

content = content.replace(
  "<Route path=\"atualizacoes\" element={<Placeholder title=\"Atualizações\" />} />",
  "<Route path=\"atualizacoes\" element={<OwnerAtualizacoes />} />"
);

fs.writeFileSync('src/App.tsx', content);
