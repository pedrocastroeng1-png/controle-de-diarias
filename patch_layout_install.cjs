const fs = require('fs');

let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

// 1. Add imports
layout = layout.replace(
  "import { cn } from '../../lib/utils';",
  "import { cn } from '../../lib/utils';\nimport { MonitorDown, CheckCircle2 } from 'lucide-react';\nimport { usePWAInstall } from '../../hooks/usePWAInstall';"
);

// 2. Add hook to AdminLayout
layout = layout.replace(
  "const [expandedGroup, setExpandedGroup] = useState<string | null>(null);",
  "const [expandedGroup, setExpandedGroup] = useState<string | null>(null);\n  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();\n  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;"
);

// 3. Add button to AdminLayout sidebar
const adminInstallBtn = `
          {isDesktop && (isInstallable || isInstalled) && (
            <div className="mt-2 mb-2 w-full">
              {isInstalled ? (
                <div className="flex items-center justify-center px-3 py-2 text-xs font-medium text-emerald-600 gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  PCEG Instalado
                </div>
              ) : (
                <button
                  onClick={promptInstall}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-[#C6922E] bg-[#C6922E]/10 hover:bg-[#C6922E]/20 transition-colors uppercase tracking-wider"
                >
                  <MonitorDown className="w-4 h-4" />
                  Instalar no PC
                </button>
              )}
            </div>
          )}
          <button
            onClick={logout}
`;
layout = layout.replace(
  "          <button\n            onClick={logout}",
  adminInstallBtn
);

// 4. Add hook to OperadorLayout
layout = layout.replace(
  "const [checkingPresenca, setCheckingPresenca] = useState(true);",
  "const [checkingPresenca, setCheckingPresenca] = useState(true);\n  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();\n  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;"
);

// 5. Add button to OperadorLayout headers (both the regular one and the presenca one)
// There are two headers in OperadorLayout (one when presenca is incomplete, one when complete)
const operatorInstallBtn = `
            {isDesktop && (isInstallable || isInstalled) && (
              <div className="hidden md:flex ml-4 mr-4">
                {isInstalled ? (
                  <span className="flex items-center text-xs font-medium text-emerald-600 gap-1">
                    <CheckCircle2 className="w-4 h-4" /> PCEG Instalado
                  </span>
                ) : (
                  <button
                    onClick={promptInstall}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#C6922E] bg-[#C6922E]/10 hover:bg-[#C6922E]/20 transition-colors uppercase tracking-wider"
                  >
                    <MonitorDown className="w-4 h-4" /> Instalar no PC
                  </button>
                )}
              </div>
            )}
            <button
              onClick={logout}
`;

layout = layout.replace(
  "            <button\n              onClick={logout}\n              className=\"text-gray-500 hover:text-red-600 p-2\"\n            >",
  operatorInstallBtn.replace("<button\n              onClick={logout}", "<button\n              onClick={logout}\n              className=\"text-gray-500 hover:text-red-600 p-2\"\n            >")
);

// Second occurrence
layout = layout.replace(
  "          <button\n            onClick={logout}\n            className=\"text-gray-500 hover:text-red-600 p-2\"\n          >",
  operatorInstallBtn.replace("            <button\n              onClick={logout}", "          <button\n            onClick={logout}\n            className=\"text-gray-500 hover:text-red-600 p-2\"\n          >")
);

fs.writeFileSync('src/components/layout/Layout.tsx', layout);
console.log("Patched Layout.tsx");
