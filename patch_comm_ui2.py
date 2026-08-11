import re

with open('src/pages/admin/Communications.tsx', 'r') as f:
    content = f.read()

old_save = """      if (editingId) {
        if (!isLocked) {
           await api.updateCommunication(editingId, payload);
        } else {
           // Can only update is_active if locked
           await api.updateCommunication(editingId, { is_active: form.is_active });
        }
      } else {
        const created = await api.createCommunication(payload);
        commId = created.id;
      }"""

new_save = """      if (editingId) {
        if (!isLocked) {
           await api.updateCommunication(editingId, payload);
        } else {
           // Can only update is_active if locked
           await api.updateCommunication(editingId, { is_active: form.is_active });
        }
      } else {
        const created = await api.createCommunication(payload);
        commId = created.id;
        if (payload.target_audience === 'OPERATOR' && payload.target_operator_id) {
           await api.createCommunicationRecipient(commId, payload.target_operator_id);
        }
      }"""

if old_save in content:
    content = content.replace(old_save, new_save)
else:
    print("old_save not found")

with open('src/pages/admin/Communications.tsx', 'w') as f:
    f.write(content)

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

new_func = """
  createCommunicationRecipient: async (communication_id: string, operator_id: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    await supabase.from('communication_recipients').insert([{ communication_id, operator_id }]);
  },
"""

content = content.replace("createCommunication: async (payload: any): Promise<any> => {", new_func + "  createCommunication: async (payload: any): Promise<any> => {")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

