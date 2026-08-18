const fs = require('fs');
let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

const opNavRegex = /<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 pb-safe shadow-\[0_-4px_6px_-1px_rgba\(0,0,0,0\.05\)\]">[\s\S]*?<\/nav>/;

const newOpNav = `<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md md:max-w-5xl mx-auto flex h-16">
          <Link
            to="/operador/presenca"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/presenca' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <ClipboardCheck className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Presença</span>
          </Link>
          <div className="w-[1px] bg-gray-100 my-2"></div>
          <Link
            to="/operador/ferramentas"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/ferramentas' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Wrench className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Ferramentas</span>
          </Link>
          <div className="w-[1px] bg-gray-100 my-2"></div>
          <Link
            to="/operador/controle-materiais"
            className={cn(
              "flex-1 flex flex-col items-center justify-center text-xs font-medium transition-colors",
              location.pathname === '/operador/controle-materiais' ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
            )}
          >
            <Package className="h-6 w-6 mb-1" />
            <span className="truncate w-full text-center">Materiais</span>
          </Link>
        </div>
      </nav>`;

layout = layout.replace(opNavRegex, newOpNav);
fs.writeFileSync('src/components/layout/Layout.tsx', layout, 'utf-8');
