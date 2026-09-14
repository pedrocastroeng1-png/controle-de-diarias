const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf8');

const target = `  getRelatorioComAtestados: async (inicio?: string, fim?: string, obraId?: string) => {
    if (!getEmpresaId()) throw new Error('Empresa não identificada. Faça login novamente.');
    // Merge before filtering worksite: actual attendance may reference a previous worksite.
    const [registros, atestados, funcionarios] = await Promise.all([
      api.getRelatorio(inicio, fim), api.getAtestados(), api.getFuncionarios('todos'),
    ]);
    return { registros: aplicarAtestados(registros, atestados, funcionarios, { inicio, fim, obraId }), funcionarios };
  },`;
const replace = `  getRelatorioComAtestados: async (inicio?: string, fim?: string, obraId?: string) => {
    if (!getEmpresaId()) throw new Error('Empresa não identificada. Faça login novamente.');
    // Merge before filtering worksite: actual attendance may reference a previous worksite.
    const [registros, atestados, funcionarios, feriadosData] = await Promise.all([
      api.getRelatorio(inicio, fim), api.getAtestados(), api.getFuncionarios('todos'), api.getFeriados(),
    ]);
    const feriados = (feriadosData || []).map((f: any) => f.data);
    return { registros: aplicarAtestados(registros, atestados, funcionarios, { inicio, fim, obraId }, feriados), funcionarios };
  },`;
content = content.replace(target, replace);
fs.writeFileSync('src/lib/api.ts', content);
