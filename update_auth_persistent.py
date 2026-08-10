import sys
import re

with open('src/contexts/AuthContext.tsx', 'r') as f:
    code = f.read()

import_prefs = "import { Preferences } from '@capacitor/preferences';\n"
if "Preferences" not in code:
    code = code.replace("import { setupPushNotifications } from '../lib/push';", "import { setupPushNotifications } from '../lib/push';\n" + import_prefs)

effect_code = """  useEffect(() => {
    const initAuth = async () => {
      let storedUserStr = null;
      try {
        const { value } = await Preferences.get({ key: '@diarias:usuario' });
        storedUserStr = value;
      } catch(e) {
      }
      
      if (!storedUserStr) {
        storedUserStr = localStorage.getItem('@diarias:usuario');
      }

      if (storedUserStr) {
        try {
          const parsed = JSON.parse(storedUserStr);
          const activeUser = await api.checkUserActive(parsed.id);
          
          if (activeUser && activeUser.ativo) {
            setUsuario(activeUser);
            setupPushNotifications(activeUser.id);
          } else if (activeUser && !activeUser.ativo) {
            // Disabled by admin
            setUsuario(null);
            localStorage.removeItem('@diarias:usuario');
            await Preferences.remove({ key: '@diarias:usuario' });
          } else {
             // Keep offline or error
             setUsuario(parsed);
             setupPushNotifications(parsed.id);
          }
        } catch (e) {
           // Invalid JSON or other error, clear it just in case, but keep it simple
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);"""

code = re.sub(r'  useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);', effect_code, code)

login_update = """        setUsuario(u);
        setupPushNotifications(u.id);
        localStorage.setItem('@diarias:usuario', JSON.stringify(u));
        try { await Preferences.set({ key: '@diarias:usuario', value: JSON.stringify(u) }); } catch(e) {}
        return true;"""
code = re.sub(r"        setUsuario\(u\);\s*setupPushNotifications\(u\.id\);\s*localStorage\.setItem\('@diarias:usuario', JSON\.stringify\(u\)\);\s*return true;", login_update, code)

logout_update = """    setUsuario(null);
    localStorage.removeItem('@diarias:usuario');
    try { Preferences.remove({ key: '@diarias:usuario' }); } catch(e) {}
    localStorage.removeItem('supabase.auth.token');"""
code = re.sub(r"    setUsuario\(null\);\s*localStorage\.removeItem\('@diarias:usuario'\);\s*localStorage\.removeItem\('supabase\.auth\.token'\);", logout_update, code)

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(code)

print("AuthContext persistent updated")
