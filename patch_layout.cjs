const fs = require('fs');

// Patch App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
const targetAppImport = `import Funcionarios from './pages/admin/Funcionarios';`;
const replaceAppImport = `import Funcionarios from './pages/admin/Funcionarios';\nimport Feriados from './pages/admin/Feriados';`;
appContent = appContent.replace(targetAppImport, replaceAppImport);

const targetAppRoute = `<Route path="funcionarios" element={<Funcionarios />} />`;
const replaceAppRoute = `<Route path="funcionarios" element={<Funcionarios />} />\n              <Route path="feriados" element={<Feriados />} />`;
appContent = appContent.replace(targetAppRoute, replaceAppRoute);
fs.writeFileSync('src/App.tsx', appContent);

// Patch Layout.tsx
let layoutContent = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');
const targetLayoutMenu = `    { to: "/admin/funcionarios", icon: Users, label: "Funcionários" },`;
const replaceLayoutMenu = `    { to: "/admin/funcionarios", icon: Users, label: "Funcionários" },\n    { to: "/admin/feriados", icon: CalendarOff, label: "Feriados e Folgas" },`;
layoutContent = layoutContent.replace(targetLayoutMenu, replaceLayoutMenu);

const targetLayoutImport = `import {`;
const replaceLayoutImport = `import {\n  CalendarOff,`;
layoutContent = layoutContent.replace(targetLayoutImport, replaceLayoutImport);

fs.writeFileSync('src/components/layout/Layout.tsx', layoutContent);

