import sys

with open('src/lib/api.ts', 'r') as f:
    code = f.read()

new_method = """
  checkUserActive: async (id: string): Promise<any | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, usuario, perfil, ativo')
      .eq('id', id)
      .single();
    if (error) return null;
    return data;
  },
"""

code = code.replace("  login: async", new_method + "\n  login: async")

with open('src/lib/api.ts', 'w') as f:
    f.write(code)

print("API User check updated")
