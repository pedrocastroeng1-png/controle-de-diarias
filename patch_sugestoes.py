import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_get_sugestoes = """  getCentralSugestoes: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('central_sugestoes')
      .select('*')
      .eq('status', 'PENDENTE')
      .order('created_at', { ascending: false });
    
    if (error) {
       // Ignore error if table doesn't exist yet, just return empty to prevent crash
       console.log("central_sugestoes table missing or error", error);
       return [
         { id: '1', titulo: 'Ferramenta não devolvida', mensagem: 'A ferramenta Martelete Bosch continua registrada como emprestada.\\n\\nFavor verificar se houve esquecimento na devolução.', tipo: 'ferramenta_pendente', created_at: new Date().toISOString() },
         { id: '2', titulo: 'Ferramenta Quebrada', mensagem: 'O operador João relatou que a Furadeira de Bancada quebrou durante o uso.', tipo: 'ferramenta_quebrada', created_at: new Date().toISOString() },
         { id: '3', titulo: 'Novo Atestado', mensagem: 'João enviou um atestado de 2 dias.', tipo: 'novo_atestado', created_at: new Date().toISOString() },
         { id: '4', titulo: 'Comunicação Não Visualizada', mensagem: 'A comunicação "Aviso Geral" enviada há 2 dias ainda não foi visualizada por 3 operadores.', tipo: 'comunicacao_nao_visualizada', created_at: new Date().toISOString() }
       ];
    }
    return data || [];
  },"""

new_get_sugestoes = """  getCentralSugestoes: async (): Promise<any[]> => {
    return []; // Disabled because central_sugestoes table does not exist in production yet
  },"""

if old_get_sugestoes in content:
    content = content.replace(old_get_sugestoes, new_get_sugestoes)
else:
    print("old_get_sugestoes not found")

old_update = """    if (sugestao_id) {
       await supabase.from('central_sugestoes').update({ status: 'ENVIADA' }).eq('id', sugestao_id);
    }"""

new_update = """    if (sugestao_id) {
       // Table does not exist in production yet
    }"""

if old_update in content:
    content = content.replace(old_update, new_update)
else:
    print("old_update not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

