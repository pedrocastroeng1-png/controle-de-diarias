import sys

with open('src/contexts/AuthContext.tsx', 'r') as f:
    code = f.read()

import_stmt = "import { setupPushNotifications } from '../lib/push';\n"
if "setupPushNotifications" not in code:
    code = code.replace("import { supabase } from '../lib/supabase';", "import { supabase } from '../lib/supabase';\n" + import_stmt)

if "setupPushNotifications(u.id);" not in code:
    code = code.replace("setUsuario(u);", "setUsuario(u);\n        setupPushNotifications(u.id);")

if "setupPushNotifications(JSON.parse(storedUser).id);" not in code:
    code = code.replace("setUsuario(JSON.parse(storedUser));", "const parsed = JSON.parse(storedUser);\n        setUsuario(parsed);\n        setupPushNotifications(parsed.id);")

with open('src/contexts/AuthContext.tsx', 'w') as f:
    f.write(code)

print("Auth updated")
