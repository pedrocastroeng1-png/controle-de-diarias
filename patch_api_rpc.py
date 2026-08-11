import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_send = """    if (destinatarios && destinatarios.length > 0) {
       const dests = destinatarios.map(d => ({
          communication_id: comm.id,
          operator_id: d
       }));
       await supabase.from('communication_recipients').insert(dests);
       
       // Push dispatch will be implemented server-side
       // The frontend should no longer call the Edge Function directly
    }"""

new_send = """    if (destinatarios && destinatarios.length > 0) {
       const dests = destinatarios.map(d => ({
          communication_id: comm.id,
          operator_id: d
       }));
       await supabase.from('communication_recipients').insert(dests);
    }
    
    if (usuario_id) {
       const { error: rpcError } = await supabase.rpc('request_communication_push', {
         p_communication_id: comm.id,
         p_usuario_id: usuario_id
       });
       if (rpcError) {
         console.error("RPC Push error:", rpcError);
         throw new Error('Comunicação salva, mas falha ao despachar notificação Push.');
       }
    }"""

if old_send in content:
    content = content.replace(old_send, new_send)
else:
    print("old_send not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

