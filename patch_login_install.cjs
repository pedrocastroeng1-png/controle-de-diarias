const fs = require('fs');

let login = fs.readFileSync('src/pages/auth/Login.tsx', 'utf8');

// Add imports
login = login.replace(
  "import { Lock, User, Loader2, ArrowRight, Building2, Users, Package, LineChart } from 'lucide-react';",
  "import { Lock, User, Loader2, ArrowRight, Building2, Users, Package, LineChart, MonitorDown, CheckCircle2 } from 'lucide-react';\nimport { usePWAInstall } from '../../hooks/usePWAInstall';"
);

// Add hook inside Login component
login = login.replace(
  "const navigate = useNavigate();",
  "const navigate = useNavigate();\n  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();\n  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;"
);

// Add install button below the submit button and above the version
const installHtml = `
          {isDesktop && (isInstallable || isInstalled) && (
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center">
              {isInstalled ? (
                <div className="flex items-center text-emerald-600 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">PCEG Instalado</span>
                </div>
              ) : isInstallable ? (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="flex items-center justify-center gap-2 text-[11px] font-bold text-[#C6922E] hover:text-[#B58529] uppercase tracking-wider transition-colors py-2 px-4 rounded-lg hover:bg-[#C6922E]/5"
                >
                  <MonitorDown className="w-4 h-4" />
                  Instalar PCEG no computador
                </button>
              ) : null}
            </div>
          )}
          <div className="mt-4 sm:mt-6 md:mt-8 text-center md:text-left shrink-0">
`;

login = login.replace(
  "<div className=\"mt-4 sm:mt-6 md:mt-8 text-center md:text-left shrink-0\">",
  installHtml
);

fs.writeFileSync('src/pages/auth/Login.tsx', login);
console.log("Patched Login.tsx with install hook");
