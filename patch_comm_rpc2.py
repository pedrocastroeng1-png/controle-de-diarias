import re

with open('src/pages/admin/Communications.tsx', 'r') as f:
    content = f.read()

old_save = """      if (selectedFiles.length > 0 && commId) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `comm_${commId}_${Date.now()}.${fileExt}`;
          
          const filePath = await api.uploadPhoto('communication-files', file, fileName);
          
          await api.createCommunicationAttachment({
            communication_id: commId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream'
          });
        }
      }

      setModalOpen(false);
      loadData();"""

new_save = """      if (selectedFiles.length > 0 && commId) {
        for (const file of selectedFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `comm_${commId}_${Date.now()}.${fileExt}`;
          
          const filePath = await api.uploadPhoto('communication-files', file, fileName);
          
          await api.createCommunicationAttachment({
            communication_id: commId,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type || 'application/octet-stream'
          });
        }
      }

      if (!editingId && commId && usuario?.id) {
         try {
           const { error: rpcError } = await supabase.rpc('request_communication_push', {
             p_communication_id: commId,
             p_usuario_id: usuario.id
           });
           if (rpcError) {
             console.error("RPC Push error:", rpcError);
             alert('Comunicação salva, mas falha ao despachar notificação Push.');
           }
         } catch (e) {
           console.error("RPC Push exception:", e);
           alert('Comunicação salva, mas falha ao despachar notificação Push.');
         }
      }

      setModalOpen(false);
      loadData();"""

if old_save in content:
    content = content.replace(old_save, new_save)
else:
    print("old_save not found")

with open('src/pages/admin/Communications.tsx', 'w') as f:
    f.write(content)

