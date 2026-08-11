import re

with open('src/pages/admin/Communications.tsx', 'r') as f:
    content = f.read()

old_save = """      if (editingId) {
        if (isLocked) {
           await api.updateCommunication(editingId, { is_active: form.is_active });
        } else {
           await api.updateCommunication(editingId, payload);
        }
      } else {
        const created = await api.createCommunication(payload);
        commId = created.id;
      }"""

new_save = """      if (editingId) {
        if (isLocked) {
           await api.updateCommunication(editingId, { is_active: form.is_active });
        } else {
           await api.updateCommunication(editingId, payload);
        }
      } else {
        const created = await api.createCommunication(payload);
        commId = created.id;
        if (payload.target_audience === 'OPERATOR' && payload.target_operator_id) {
           // Insert into recipients
           try {
             await supabase.from('communication_recipients').insert([{
               communication_id: commId,
               operator_id: payload.target_operator_id
             }]);
           } catch (e) {
             console.error("Erro ao salvar destinatário:", e);
           }
        }
      }"""

if old_save in content:
    content = content.replace(old_save, new_save)
else:
    print("old_save not found")

with open('src/pages/admin/Communications.tsx', 'w') as f:
    content = "import { supabase } from '../../lib/supabase';\n" + content.replace("import { supabase } from '../../lib/supabase';\n", "")
    f.write(content)

