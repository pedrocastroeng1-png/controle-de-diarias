const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

const targetStatus = `<td className="px-6 py-4 whitespace-nowrap text-sm">
                    {funcionario.ativo !== false ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Inativo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {funcionario.tipo_colaborador || 'DIARISTA'}
                  </td>`;

const newStatus = `<td className="px-6 py-4 whitespace-nowrap text-sm">
                    {funcionario.ativo !== false ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                        ATIVO
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">
                        INATIVO
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {funcionario.tipo_colaborador === 'CLT' ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                        CLT
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                        DIARISTA
                      </span>
                    )}
                  </td>`;

code = code.replace(targetStatus, newStatus);
fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
