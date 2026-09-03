const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const targetFunction = `  updateFuncionario: async (
    id: string,
    funcionario: Partial<Funcionario>,
  ): Promise<Funcionario> => {`;

const newFunction = `  updateFuncionariosObra: async (ids: string[], obra_id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await withEmpresa(supabase.from("funcionarios").update({ obra_id }).in("id", ids));
    if (error) throw error;
  },
  updateFuncionario: async (
    id: string,
    funcionario: Partial<Funcionario>,
  ): Promise<Funcionario> => {`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync('src/lib/api.ts', code);
