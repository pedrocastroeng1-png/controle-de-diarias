import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_try = """       try {
         await supabase.functions.invoke('send-push', {
           body: { communication_id: comm.id }
         });
       } catch (e) {
         console.error('Error invoking send-push:', e);
       }"""

new_try = """       try {
         const { error: pushError } = await supabase.functions.invoke('send-push', {
           body: { communication_id: comm.id }
         });
         if (pushError) throw pushError;
       } catch (e) {
         console.error('Error invoking send-push:', e);
         throw new Error('Comunicação salva, mas falha ao despachar notificação Push (Edge Function erro).');
       }"""

if old_try in content:
    content = content.replace(old_try, new_try)
else:
    print("old_try not found")

with open('src/lib/api.ts', 'w') as f:
    f.write(content)

