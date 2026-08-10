import sys

with open('src/contexts/AuthContext.tsx', 'r') as f:
    code = f.read()

import re
old_check = r"""          const activeUser = await api\.checkUserActive\(parsed\.id\);
          
          if \(activeUser && activeUser\.ativo\) \{
            setUsuario\(activeUser\);
            setupPushNotifications\(activeUser\.id\);
          \} else if \(activeUser && !activeUser\.ativo\) \{
            // Disabled by admin
            setUsuario\(null\);
            localStorage\.removeItem\('@diarias:usuario'\);
            await Preferences\.remove\(\{ key: '@diarias:usuario' \}\);
          \} else \{
             // Keep offline or error
             setUsuario\(parsed\);
             setupPushNotifications\(parsed\.id\);
          \}"""

new_check = """          const res = await api.checkUserActive(parsed.id);
          
          if (res.data && res.data.ativo) {
            setUsuario(res.data);
            setupPushNotifications(res.data.id);
          } else if (res.data && !res.data.ativo) {
            // Disabled by admin
            setUsuario(null);
            localStorage.removeItem('@diarias:usuario');
            await Preferences.remove({ key: '@diarias:usuario' });
          } else if (res.error && res.error.code === 'PGRST116') {
            // User deleted
            setUsuario(null);
            localStorage.removeItem('@diarias:usuario');
            await Preferences.remove({ key: '@diarias:usuario' });
          } else {
             // Keep offline or other network error
             setUsuario(parsed);
             setupPushNotifications(parsed.id);
          }"""

code = re.sub(old_check, new_check, code)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(code)

print("AuthContext check error updated")
