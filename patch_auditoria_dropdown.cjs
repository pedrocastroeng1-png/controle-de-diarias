const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AuditoriaPresencas.tsx', 'utf8');

const anchorDropdown = `<div className="font-medium text-gray-900">{f.nome}</div>`;

const newDropdown = `<div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">{f.nome}</span>
                              {f.tipo_colaborador === 'CLT' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200 ml-2">
                                  CLT
                                </span>
                              )}
                            </div>`;

code = code.replace(anchorDropdown, newDropdown);
fs.writeFileSync('src/pages/admin/AuditoriaPresencas.tsx', code);
