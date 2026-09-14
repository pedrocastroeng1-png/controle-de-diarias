const fs = require('fs');
const content = fs.readFileSync('src/lib/api.ts', 'utf8');
const target = `  },
  toggleFornecedorStatus: async (id: string, ativo: boolean): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await withEmpresa(supabase.from("fornecedores")).update({ ativo }).eq("id", id);
  }
};`;
const replacement = `  },
  toggleFornecedorStatus: async (id: string, ativo: boolean): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await withEmpresa(supabase.from("fornecedores")).update({ ativo }).eq("id", id);
  },
  getFeriados: async (): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await withEmpresa(supabase.from("feriados")).select("*").order("data", { ascending: true });
    if (error) {
      if (error.code === '42P01') return []; // Relation does not exist
      throw error;
    }
    return data || [];
  },
  createFeriado: async (feriado: { data: string, descricao: string }): Promise<any> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { data, error } = await supabase.from("feriados").insert({ ...feriado, empresa_id: getEmpresaId() }).select().single();
    if (error) throw error;
    return data;
  },
  deleteFeriado: async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase não configurado");
    const { error } = await withEmpresa(supabase.from("feriados")).delete().eq("id", id);
    if (error) throw error;
  }
};`;
fs.writeFileSync('src/lib/api.ts', content.replace(target, replacement));
