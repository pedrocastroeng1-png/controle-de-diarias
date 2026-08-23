const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/ControleMateriais.tsx', 'utf-8');

if (!code.includes('ComprasMateriaisTab')) {
  code = code.replace(
    "import { Package } from 'lucide-react';",
    "import { Package } from 'lucide-react';\nimport ComprasMateriaisTab from './ComprasMateriaisTab';"
  );
  
  const contentRegex = /{activeTab === 'compras' && <p>Módulo de Cadastro de Compras \(Em desenvolvimento\)<\/p>}/;
  code = code.replace(contentRegex, "{activeTab === 'compras' && <ComprasMateriaisTab />}");
}

fs.writeFileSync('src/pages/admin/ControleMateriais.tsx', code, 'utf-8');
