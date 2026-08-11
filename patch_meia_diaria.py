import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_toggle = """  toggleMeiaDiaria: async (presenca_id: string, is_meia: boolean, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    try {
      const { data: userData } = await supabase.from('usuarios').select('perfil').eq('id', usuario_id).single();
      if (userData?.perfil !== 'ADMIN') {
         throw new Error('Apenas administradores podem definir meia diária.');
      }
      
      const { data: presenca } = await supabase.from('presencas').select('*, funcionario:funcionarios(nome, funcao:funcoes(valor_diaria))').eq('id', presenca_id).single();
      if (!presenca) throw new Error('Presença não encontrada.');
      
      const funcNome = presenca.funcionario?.nome || 'Funcionário';
      const valorBase = presenca.funcionario?.funcao?.valor_diaria || 0;
      const valorAntigo = presenca.meia_diaria ? valorBase / 2 : valorBase;
      const valorNovo = is_meia ? valorBase / 2 : valorBase;
      
      const { error: updError } = await supabase.from('presencas').update({ meia_diaria: is_meia }).eq('id', presenca_id);
      if (updError) {
        if (updError.message.includes('does not exist')) {
            throw new Error('A coluna meia_diaria não existe. O banco de dados precisa ser atualizado executando database_meia_diaria.sql');
        }
        throw updError;
      }
      
      // We log in a generic way if possible, or skip if no generic audit table exists.
      // The app has 'historico_ferramentas', but no generic 'audit_logs'. We'll just rely on the DB update.
    } catch (e: any) {
        throw e;
    }
  },"""

new_toggle = """  toggleMeiaDiaria: async (presenca_id: string, is_meia: boolean, usuario_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    try {
      if (is_meia) {
        const { error } = await supabase.rpc('definir_meia_diaria', {
          p_presenca_id: presenca_id,
          p_usuario_id: usuario_id
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('reverter_meia_diaria', {
          p_presenca_id: presenca_id,
          p_usuario_id: usuario_id
        });
        if (error) throw error;
      }
    } catch (e: any) {
        throw e;
    }
  },"""

if old_toggle in content:
    content = content.replace(old_toggle, new_toggle)
else:
    print("old_toggle not found!")

# Also fix the `getPresencasPorObraEData` or anywhere `meia_diaria` is read.
# The prompt says: The database stores `tipo_diaria = 'MEIA_DIARIA'`.
# So we need to map `tipo_diaria === 'MEIA_DIARIA'` to `meia_diaria: true` in JS so the frontend doesn't break, OR just change the frontend to use `tipo_diaria`.

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

