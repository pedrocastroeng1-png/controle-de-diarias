const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

// Using standard string replacements instead of regex to avoid mismatch due to newlines
// 1. DIAS_SEMANA
let dias_old = `{DIAS_SEMANA.map(dia => (
                      <label key={dia} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(formData.days_of_week || []).includes(dia)}
                          onChange={() => toggleArrayItem('days_of_week', dia)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{dia}</span>
                      </label>
                    ))}`;
                    
let dias_new = `{DIAS_SEMANA.map(dia => (
                      <label key={dia.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(formData.days_of_week || []).includes(dia.value)}
                          onChange={() => toggleArrayItem('days_of_week', dia.value)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{dia.label}</span>
                      </label>
                    ))}`;
code = code.replace(dias_old, dias_new);

// 2. DESTINATARIOS
let dest_old = `{DESTINATARIOS.map(dest => (
                    <label key={dest} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.recipients || []).includes(dest)}
                        onChange={() => toggleArrayItem('recipients', dest)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{dest}</span>
                    </label>
                  ))}`;
                  
let dest_new = `{DESTINATARIOS.map(dest => (
                    <label key={dest.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(formData.recipients || []).includes(dest.value)}
                        onChange={() => toggleArrayItem('recipients', dest.value)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{dest.label}</span>
                    </label>
                  ))}`;
code = code.replace(dest_old, dest_new);

fs.writeFileSync('src/pages/admin/AutomationsForm.tsx', code, 'utf-8');
