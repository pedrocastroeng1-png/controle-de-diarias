const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  "import Funcionarios from './pages/admin/Funcionarios';",
  "import Funcionarios from './pages/admin/Funcionarios';\nimport ControleMateriais from './pages/admin/ControleMateriais';"
);

app = app.replace(
  "<Route path=\"ferramentas\" element={<FerramentasAdmin />} />",
  "<Route path=\"ferramentas\" element={<FerramentasAdmin />} />\n              <Route path=\"controle-materiais\" element={<ControleMateriais />} />"
);

app = app.replace(
  "<Route path=\"ferramentas\" element={<FerramentasOperador />} />",
  "<Route path=\"ferramentas\" element={<FerramentasOperador />} />\n              <Route path=\"controle-materiais\" element={<ControleMateriais />} />"
);

fs.writeFileSync('src/App.tsx', app, 'utf-8');
