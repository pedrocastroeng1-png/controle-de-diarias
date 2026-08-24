const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('import OwnerUsuarios')) {
  content = content.replace(
    "import OwnerEmpresas from './pages/owner/Empresas';",
    "import OwnerEmpresas from './pages/owner/Empresas';\nimport OwnerUsuarios from './pages/owner/Usuarios';"
  );
  
  content = content.replace(
    "<Route path=\"empresas\" element={<OwnerEmpresas />} />",
    "<Route path=\"empresas\" element={<OwnerEmpresas />} />\n              <Route path=\"usuarios\" element={<OwnerUsuarios />} />"
  );
  
  fs.writeFileSync('src/App.tsx', content);
}
