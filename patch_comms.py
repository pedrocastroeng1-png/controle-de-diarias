import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

# Replace getCentralComunicacoes
old_get = """  getCentralComunicacoes: async (): Promise<any[]> => {
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
  },"""

new_get = """  getCentralComunicacoes: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('communications')
      .select(`
        *,
        remetente:usuarios!created_by(id, usuario),
        destinatarios:communication_recipients(id, read_at, confirmed, usuario:usuarios!operator_id(id, usuario))
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.log("communications table missing or error", error);
      return [];
    }
    return data.map((item: any) => ({
      id: item.id,
      titulo: item.title,
      mensagem: item.message,
      data_envio: item.created_at,
      created_at: item.created_at,
      remetente: item.remetente,
      destinatarios: item.destinatarios ? item.destinatarios.map((d: any) => ({
        id: d.id,
        lida: d.read_at !== null,
        data_leitura: d.read_at,
        usuario: d.usuario
      })) : []
    }));
  },"""

if old_get in content:
    content = content.replace(old_get, new_get)
else:
    print("old_get not found!")

# Replace sendCentralCommunication
old_send = """  sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string }): Promise<void> => {
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
  },"""

new_send = """  sendCentralCommunication: async ({ titulo, mensagem, destinatarios, sugestao_id }: { titulo: string, mensagem: string, destinatarios: string[], sugestao_id?: string }): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // In a real scenario we'd do a transaction, here we insert and map
    const { data: comm, error } = await supabase
      .from('communications')
      .insert([{ 
        title: titulo, 
        message: mensagem,
        type: 'INFO',
        priority: 'NORMAL',
        target_audience: 'SPECIFIC'
      }])
      .select('id')
      .single();
      
    if (error) throw error;
    
    if (destinatarios && destinatarios.length > 0) {
       const dests = destinatarios.map(d => ({
          communication_id: comm.id,
          operator_id: d
       }));
       await supabase.from('communication_recipients').insert(dests);
       
       try {
         await supabase.functions.invoke('send-push', {
           body: { communication_id: comm.id }
         });
       } catch (e) {
         console.error('Error invoking send-push:', e);
       }
    }
    
    if (sugestao_id) {
       await supabase.from('central_sugestoes').update({ status: 'ENVIADA' }).eq('id', sugestao_id);
    }
  },"""

if old_send in content:
    content = content.replace(old_send, new_send)
else:
    print("old_send not found!")

# Replace getUnread
old_unread = """  getUnreadCentralCommunications: async (usuario_id: string): Promise<any[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('central_destinatarios')
        .select('*, comunicacao:central_comunicacoes(*)')
        .eq('usuario_id', usuario_id)
        .eq('lida', false);
      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  },"""

new_unread = """  getUnreadCentralCommunications: async (usuario_id: string): Promise<any[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('communication_recipients')
        .select('*, comunicacao:communications(*)')
        .eq('operator_id', usuario_id)
        .is('read_at', null);
      if (error) return [];
      return data.map((item: any) => ({
        id: item.id,
        lida: item.read_at !== null,
        data_leitura: item.read_at,
        comunicacao: {
           id: item.comunicacao.id,
           titulo: item.comunicacao.title,
           mensagem: item.comunicacao.message,
           data_envio: item.comunicacao.created_at,
           created_at: item.comunicacao.created_at
        }
      }));
    } catch (e) {
      return [];
    }
  },"""

if old_unread in content:
    content = content.replace(old_unread, new_unread)
else:
    print("old_unread not found!")

# Replace mark as read
old_mark = """  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
     if (!supabase) return;
     await supabase.from('central_destinatarios').update({ lida: true, data_leitura: new Date().toISOString() }).eq('id', id);
  }"""

new_mark = """  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
     if (!supabase) return;
     await supabase.from('communication_recipients').update({ read_at: new Date().toISOString() }).eq('id', id);
  }"""

if old_mark in content:
    content = content.replace(old_mark, new_mark)
else:
    print("old_mark not found!")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

