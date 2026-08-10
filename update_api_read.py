import sys

with open('src/lib/api.ts', 'r') as f:
    code = f.read()

new_methods = """
  getUnreadCentralCommunications: async (usuario_id: string): Promise<any[]> => {
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
  },

  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('central_destinatarios').update({ lida: true, data_leitura: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  },
"""

code = code.replace("  registerPushDevice:", new_methods + "  registerPushDevice:")

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

print("API Read updated")
