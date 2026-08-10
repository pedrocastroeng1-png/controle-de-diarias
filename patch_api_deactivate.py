import re

with open('src/lib/api.ts', 'r') as f:
    content = f.read()

deactivate_func = """
  deactivatePushDevice: async (token: string): Promise<void> => {
    if (!supabase) return;
    try {
      await supabase.from('push_devices').update({ ativo: false }).eq('token', token);
    } catch (e) {
      console.error('Error deactivating push device:', e);
    }
  },
"""

content = re.sub(r'registerPushDevice:\s*async.*?\},\s*', lambda m: m.group(0) + deactivate_func, content, count=1, flags=re.DOTALL)

with open('src/lib/api.ts', 'w') as f:
    f.write(content)
