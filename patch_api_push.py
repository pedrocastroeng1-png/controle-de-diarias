import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

old_func = """  registerPushDevice: async (user_id: string, token: string, platform: string): Promise<void> => {
     if (!supabase) return;
     try {
       await supabase.from('push_devices').upsert([{ user_id, token, platform }], { onConflict: 'user_id, token' });
     } catch (e) {}
  },"""

new_func = """  registerPushDevice: async (usuario_id: string, token: string, plataforma: string): Promise<void> => {
    if (!supabase) return;
    try {
      const { data: existing } = await supabase.from('push_devices').select('id').eq('token', token).single();
      const payload = {
        usuario_id,
        token,
        plataforma: plataforma.toUpperCase(),
        ativo: true,
        ultimo_uso_at: new Date().toISOString()
      };
      if (existing) {
        await supabase.from('push_devices').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('push_devices').insert([payload]);
      }
    } catch (e) {
      console.error('Error registering push device:', e);
    }
  },"""

# If old_func matches, replace. Otherwise just use regex.
if old_func in content:
    content = content.replace(old_func, new_func)
else:
    # Try regex
    content = re.sub(r'registerPushDevice.*?\}\s*\},', new_func, content, flags=re.DOTALL)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
