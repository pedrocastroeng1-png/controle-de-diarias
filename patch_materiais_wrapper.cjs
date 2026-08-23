const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ControleMateriais.tsx', 'utf-8');

code = code.replace(
  /<div className="text-center py-12 text-gray-500">\s*\{activeTab === 'compras' && <ComprasMateriaisTab \/>\}\s*\{activeTab === 'quantidade' && isAdmin && <p>Controle de Quantidade \(Em desenvolvimento\)<\/p>\}\s*\{activeTab === 'relatorios' && isAdmin && <p>Relatórios de Materiais \(Em desenvolvimento\)<\/p>\}\s*<\/div>/g,
  `<div>
            {activeTab === 'compras' && <div className="text-left"><ComprasMateriaisTab /></div>}
            {activeTab === 'quantidade' && isAdmin && <div className="text-center py-12 text-gray-500"><p>Controle de Quantidade (Em desenvolvimento)</p></div>}
            {activeTab === 'relatorios' && isAdmin && <div className="text-center py-12 text-gray-500"><p>Relatórios de Materiais (Em desenvolvimento)</p></div>}
          </div>`
);

fs.writeFileSync('src/pages/admin/ControleMateriais.tsx', code, 'utf-8');
