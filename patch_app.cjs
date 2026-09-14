const fs = require('fs');
let file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import Funcoes from './pages/admin/Funcoes';",
  "import Funcoes from './pages/admin/Funcoes';\nimport Feriados from './pages/admin/Feriados';"
);
content = content.replace(
  '<Route path="funcoes" element={<Funcoes />} />',
  '<Route path="funcoes" element={<Funcoes />} />\n              <Route path="feriados" element={<Feriados />} />'
);

fs.writeFileSync(file, content);
