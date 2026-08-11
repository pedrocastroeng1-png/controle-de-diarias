import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_mark = """  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('central_destinatarios').update({ lida: true, data_leitura: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  },"""

new_mark = """  markCentralCommunicationAsRead: async (id: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('communication_recipients').update({ read_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  },"""

if old_mark in content:
    content = content.replace(old_mark, new_mark)
else:
    print("old_mark not found again")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

