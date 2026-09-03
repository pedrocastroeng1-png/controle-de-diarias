const fs = require('fs');
let code = fs.readFileSync('src/pages/operador/Presenca.tsx', 'utf8');

const anchor1 = `<p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                              {f.nome}
                            </p>`;

const new1 = `<div className="flex items-center gap-2">
                              <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                                {f.nome}
                              </p>
                              {f.tipo_colaborador === 'CLT' && (
                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  CLT
                                </span>
                              )}
                            </div>`;

code = code.replace(anchor1, new1);

const anchor2 = `<p className="text-base sm:text-lg font-bold text-slate-800 leading-tight transition-colors">
                            {f.nome}
                          </p>`;

const new2 = `<div className="flex items-center gap-2">
                            <p className="text-base sm:text-lg font-bold text-slate-800 leading-tight transition-colors">
                              {f.nome}
                            </p>
                            {f.tipo_colaborador === 'CLT' && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 text-blue-800 border border-blue-200">
                                CLT
                              </span>
                            )}
                          </div>`;

code = code.replace(anchor2, new2);
fs.writeFileSync('src/pages/operador/Presenca.tsx', code);
