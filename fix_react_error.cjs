const fs = require('fs');

let code = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

// Fix toggleArrayItem signature
code = code.replace(
  "const toggleArrayItem = (field: 'days_of_week' | 'recipients' | 'channels', item: any) => {",
  "const toggleArrayItem = (field: 'days_of_week' | 'recipients' | 'channels', item: number | string) => {"
);

// Fix DIAS_SEMANA map
code = code.replace(
  /\{DIAS_SEMANA\.map\(dia => \([\s\S]*?<span className="text-sm text-slate-700">\{dia\}<\/span>[\s\S]*?<\/label>\s*\)\}/,
  `{DIAS_SEMANA.map(dia => (
                      <label key={dia.value} className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={(formData.days_of_week || []).includes(dia.value)}
                          onChange={() => toggleArrayItem('days_of_week', dia.value)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">{dia.label}</span>
                      </label>
                    ))}`
);

// We need to double check if the previous replace failed because it was searching for {dia} and it actually didn't match
