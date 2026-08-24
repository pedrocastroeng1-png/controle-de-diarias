const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import OwnerPlanos from './pages/owner/Planos';",
  "import OwnerPlanos from './pages/owner/Planos';\nimport OwnerAuditoria from './pages/owner/Auditoria';"
);

content = content.replace(
  "<Route path=\"auditoria\" element={<Placeholder title=\"Auditoria\" />} />",
  "<Route path=\"auditoria\" element={<OwnerAuditoria />} />"
);

fs.writeFileSync('src/App.tsx', content);
