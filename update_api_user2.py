import sys

with open('src/lib/api.ts', 'r') as f:
    code = f.read()

new_method = """
  checkUserActive: async (id: string): Promise<{ data: any | null, error: any | null }> => {
    if (!supabase) return { data: null, error: new Error('Supabase não configurado') };
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, perfil, ativo')
      .eq('id', id)
      .single();
    return { data, error };
  },
"""

import re
code = re.sub(r'  checkUserActive: async \(id: string\): Promise<any \| null> => \{[\s\S]*?\},', new_method.strip() + ',', code)

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

print("API User check updated again")
