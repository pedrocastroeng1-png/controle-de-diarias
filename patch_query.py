import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_func = """  getFuncionariosPorObra: async (obra_id: string, apenasDiaristas = false): Promise<Funcionario[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('funcionarios')
      .select(`*, funcao:funcoes(*), obra:obras(*)`)
      .eq('obra_id', obra_id)
      .eq('ativo', true);
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }
    query = query.order('nome');
    if (error) throw error;
    return data as any;
  },"""

new_func = """  getFuncionariosPorObra: async (obra_id: string, apenasDiaristas = false): Promise<Funcionario[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('funcionarios')
      .select(`*, funcao:funcoes(*), obra:obras(*)`)
      .eq('obra_id', obra_id)
      .eq('ativo', true);
    if (apenasDiaristas) {
      query = query.or('tipo_colaborador.eq.DIARISTA,tipo_colaborador.is.null');
    }
    query = query.order('nome');
    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  },"""

if old_func in content:
    content = content.replace(old_func, new_func)
else:
    print("old_func not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

