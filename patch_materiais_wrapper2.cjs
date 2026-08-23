const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ControleMateriais.tsx', 'utf-8');

if (!code.includes('QuantidadeMateriaisTab')) {
  code = code.replace(
    "import ComprasMateriaisTab from './ComprasMateriaisTab';",
    "import ComprasMateriaisTab from './ComprasMateriaisTab';\nimport QuantidadeMateriaisTab from './QuantidadeMateriaisTab';"
  );
  
  const contentRegex = /\{activeTab === 'quantidade' && isAdmin && <div className="text-center py-12 text-gray-500"><p>Controle de Quantidade \(Em desenvolvimento\)<\/p><\/div>\}/;
  code = code.replace(contentRegex, "{activeTab === 'quantidade' && isAdmin && <div className=\"text-left\"><QuantidadeMateriaisTab /></div>}");
}

fs.writeFileSync('src/pages/admin/ControleMateriais.tsx', code, 'utf-8');
