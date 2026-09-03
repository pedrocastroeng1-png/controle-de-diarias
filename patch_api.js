const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const targetFunction = `  updateFuncionario: async (
    id: string,
    funcionario: Partial<Funcionario>,
  ): Promise<Funcionario> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await withEmpresa(supabase.from("funcionarios").update(funcionario),
    )
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },`;

const newFunction = \`  updateFuncionario: async (
    id: string,
    funcionario: Partial<Funcionario>,
  ): Promise<Funcionario> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await withEmpresa(supabase.from("funcionarios").update(funcionario),
    )
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as any;
  },
  updateFuncionariosObra: async (ids: string[], obraId: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await withEmpresa(supabase.from("funcionarios").update({ obra_id: obraId }).in("id", ids));
    if (error) throw error;
  },\`;

code = code.replace(targetFunction, newFunction);
fs.writeFileSync('src/lib/api.ts', code);
