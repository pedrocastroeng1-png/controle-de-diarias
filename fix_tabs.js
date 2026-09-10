import fs from 'fs';
let content = fs.readFileSync('src/pages/admin/ControleMateriais.tsx', 'utf-8');

// For OPERADOR, restrict to only ENTRADAS
// The tabs rendering currently is:
/*
          <nav className="flex overflow-x-auto">
            <button ... Painel Gerencial ...>
            <button ... Entradas (Compras) ...>
            <button ... Fornecedores ...>
            {isAdmin && <button ... Relatórios & Exportação ...>}
          </nav>
*/

content = content.replace(
  /<nav className="flex overflow-x-auto">([\s\S]*?)<\/nav>/,
  `<nav className="flex overflow-x-auto">
            {isAdmin && (
              <button
                onClick={() => setActiveTab('painel')}
                className={\`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors \${
                  activeTab === 'painel' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }\`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Resumo (Administrativo)
              </button>
            )}
            <button
              onClick={() => setActiveTab('compras')}
              className={\`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors \${
                activeTab === 'compras' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }\`}
            >
              <ShoppingCart className="w-4 h-4" />
              Entradas (Compras)
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab('fornecedores')}
                className={\`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors \${
                  activeTab === 'fornecedores' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }\`}
              >
                <Truck className="w-4 h-4" />
                Fornecedores
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('relatorios')}
                className={\`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors \${
                  activeTab === 'relatorios' 
                    ? 'border-blue-500 text-blue-700 bg-blue-50/50' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }\`}
              >
                <FileText className="w-4 h-4" />
                Relatórios & Exportação
              </button>
            )}
          </nav>`
);

// Also handle the default active tab. It's 'painel'. Let's set it to 'compras' for Operador
content = content.replace(
  /const \[activeTab, setActiveTab\] = useState\('painel'\);/,
  `const [activeTab, setActiveTab] = useState(isAdmin ? 'painel' : 'compras');`
);

fs.writeFileSync('src/pages/admin/ControleMateriais.tsx', content);
