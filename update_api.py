with open('src/lib/api.ts', 'r') as f:
    content = f.read()

new_methods = """
  getFolhaDiarias: async (
    dataInicial?: string,
    dataFinal?: string,
    obraId?: string,
  ): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from("vw_folha_diarias")).select("*");
    
    if (dataInicial) {
      query = query.gte("data", dataInicial);
    }
    if (dataFinal) {
      query = query.lte("data", dataFinal);
    }
    if (obraId) {
      query = query.eq("obra_id", obraId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  getRelatorioCLT: async (
    dataInicial?: string,
    dataFinal?: string,
    obraId?: string,
  ): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    let query = withEmpresa(supabase.from("vw_relatorio_funcionarios_clt")).select("*");
    
    if (dataInicial) {
      query = query.gte("data", dataInicial);
    }
    if (dataFinal) {
      query = query.lte("data", dataFinal);
    }
    if (obraId) {
      query = query.eq("obra_id", obraId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },
"""

content = content.replace('getRelatorio: async (', new_methods + '\n  getRelatorio: async (')

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
