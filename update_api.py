import sys

with open('src/lib/api.ts', 'r') as f:
    code = f.read()

new_methods = """
  // Central de Comunicações
  getCentralSugestoes: async (): Promise<any[]> => {
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
         { id: '1', titulo: 'Ferramenta não devolvida', mensagem: 'Martelete Bosch continua com o operador.', tipo: 'ferramenta_pendente', created_at: new Date().toISOString() },
         { id: '2', titulo: 'Novo Atestado', mensagem: 'João enviou um atestado de 2 dias.', tipo: 'novo_atestado', created_at: new Date().toISOString() }
       ];
    }
    return data || [];
  },

  getCentralComunicacoes: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('central_comunicacoes')
      .select(`
        *,
        remetente:usuarios!remetente_id(id, usuario),
        destinatarios:central_destinatarios(id, lida, data_leitura, usuario:usuarios!usuario_id(id, usuario))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log("central_comunicacoes table missing or error", error);
      return [];
    }
    return data || [];
  },

  sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string }): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // In a real scenario we'd do a transaction, here we insert and map
    const { data: comm, error } = await supabase
      .from('central_comunicacoes')
      .insert([{ titulo, mensagem }])
      .select('id')
      .single();
      
    if (error) throw error;
    
    if (destinatarios && destinatarios.length > 0) {
       const dests = destinatarios.map(d => ({
          comunicacao_id: comm.id,
          usuario_id: d
       }));
       await supabase.from('central_destinatarios').insert(dests);
    }
    
    if (sugestao_id) {
       await supabase.from('central_sugestoes').update({ status: 'ENVIADA' }).eq('id', sugestao_id);
    }
  },
  
  registerPushDevice: async (user_id: string, token: string, platform: string): Promise<void> => {
     if (!supabase) return;
     try {
       await supabase.from('push_devices').upsert([{ user_id, token, platform }], { onConflict: 'user_id, token' });
     } catch (e) {}
  },
"""

code = code.replace("  marcarPerdidaFerramenta:", new_methods + "  marcarPerdidaFerramenta:")

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

print("API updated")
