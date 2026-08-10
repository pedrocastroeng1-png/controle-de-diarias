import sys

with open('src/App.tsx', 'r') as f:
    code = f.read()

import_statement = "import CentralComunicacoes from './pages/admin/CentralComunicacoes';\n"
if 'CentralComunicacoes' not in code:
    code = code.replace("import Communications from './pages/admin/Communications';", "import Communications from './pages/admin/Communications';\n" + import_statement)
    
route_statement = '              <Route path="central-comunicacoes" element={<CentralComunicacoes />} />\n'
if 'central-comunicacoes' not in code:
    code = code.replace('<Route path="comunicacoes" element={<Communications />} />', '<Route path="comunicacoes" element={<Communications />} />\n' + route_statement)

with open('src/App.tsx', 'w') as f:
    f.write(code)

print("App updated")
