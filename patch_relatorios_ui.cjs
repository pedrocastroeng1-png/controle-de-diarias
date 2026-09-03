const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Relatorios.tsx', 'utf8');

const anchorDetalhado = `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {p.status === 'FALTOU' ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vCalc)}
                        </td>`;

const newDetalhado = `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                          {p.status === 'FALTOU' ? '-' : (funcionariosBase.find(fb => fb.id === p.funcionario_id || fb.nome === p.funcionario_nome)?.tipo_colaborador === 'CLT' ? <span className="text-blue-600 font-bold text-xs">PAGAMENTO EM FOLHA - CLT</span> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(vCalc))}
                        </td>`;

code = code.replace(anchorDetalhado, newDetalhado);

const anchorResumoDiaria = `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorDiaria)}
                      </td>`;

const newResumoDiaria = `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {item.isCLT ? '-' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valorDiaria)}
                      </td>`;

code = code.replace(anchorResumoDiaria, newResumoDiaria);

const anchorResumoTotal = `<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>`;

const newResumoTotal = `<td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                        {item.isCLT ? <span className="text-blue-600 text-xs uppercase tracking-wide">PAGAMENTO EM FOLHA - CLT</span> : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total)}
                      </td>`;

code = code.replace(anchorResumoTotal, newResumoTotal);

fs.writeFileSync('src/pages/admin/Relatorios.tsx', code);
