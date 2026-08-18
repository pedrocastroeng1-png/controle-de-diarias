import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import Automations from './pages/admin/Automations';\n"
if "Automations" not in content:
    content = re.sub(r'(import Relatorios from \'./pages/admin/Relatorios\';)', r'\1\n' + import_stmt, content)
    
    route_stmt = '          <Route path="automacoes" element={<RequireAdmin><Automations /></RequireAdmin>} />\n'
    content = re.sub(r'(<Route path="relatorios" element={<RequireAdmin><Relatorios /></RequireAdmin>} />)', r'\1\n' + route_stmt, content)
    
    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched App.tsx")
else:
    print("Already patched")
