const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Ferramentas/FerramentaDetalhes.tsx', 'utf-8');

const actionsHTML = `
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {ferramenta.status === 'ATIVA' && (
                <>
                  <button onClick={() => alert('Emprestar (Implemente no painel principal)')} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                    Emprestar
                  </button>
                  <button onClick={async () => {
                    if (confirm('Enviar para reparo?')) {
                      await api.marcarReparoFerramenta(ferramenta.id, 'Enviada pela tela de detalhes', 'user-id-mock'); // Need real user context
                      window.location.reload();
                    }
                  }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-orange-700 bg-orange-100 hover:bg-orange-200">
                    <Wrench className="h-4 w-4 mr-1" /> Reparo
                  </button>
                </>
              )}
              {ferramenta.status === 'EMPRESTADA' && (
                <button onClick={() => alert('Devolver (Implemente no painel de emprestadas)')} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700">
                  <CornerDownLeft className="h-4 w-4 mr-1" /> Devolver
                </button>
              )}
              {['ATIVA', 'EMPRESTADA'].includes(ferramenta.status) && (
                <button onClick={async () => {
                  if (confirm('Marcar como quebrada?')) {
                    await api.marcarQuebradaFerramenta(ferramenta.id, 'Marcada na tela de detalhes', 'user-id-mock'); // Need real user context
                    window.location.reload();
                  }
                }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-red-700 bg-red-100 hover:bg-red-200">
                  <AlertTriangle className="h-4 w-4 mr-1" /> Quebrada
                </button>
              )}
              {ferramenta.status !== 'PERDIDA' && ferramenta.status !== 'INATIVA' && (
                <button onClick={async () => {
                  if (confirm('Marcar como perdida?')) {
                    await api.marcarPerdidaFerramenta(ferramenta.id, 'Marcada na tela de detalhes', 'user-id-mock');
                    window.location.reload();
                  }
                }} className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-gray-700 bg-gray-100 hover:bg-gray-200">
                  Perdida
                </button>
              )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
`;

code = code.replace(/<\/span>\s*<\/div>\s*<div className="mt-6 grid grid-cols-2 gap-4">/, `</span>\n            </div>` + actionsHTML);

code = code.replace("const { id } = useParams();", "const { id } = useParams();\n  const { usuario } = require('../../../contexts/AuthContext').useAuth();");
code = code.replace(/'user-id-mock'/g, "usuario?.id");
fs.writeFileSync('src/pages/admin/Ferramentas/FerramentaDetalhes.tsx', code);
console.log('Added buttons');
