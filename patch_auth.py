import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    content = f.read()

logout_func = """  const logout = () => {
    // 0. Deactivate token
    const token = localStorage.getItem('@diarias:push_token');
    if (token) {
      api.deactivatePushDevice(token).catch(e => console.error(e));
      localStorage.removeItem('@diarias:push_token');
    }

    // 1. Limpar estado local imediatamente
"""

content = content.replace("  const logout = () => {\n    // 1. Limpar estado local", logout_func)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(content)
