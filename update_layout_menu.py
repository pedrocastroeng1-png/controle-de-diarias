import sys

with open('src/components/layout/Layout.tsx', 'r') as f:
    code = f.read()

menu_item = "    { name: 'Central de Comunicações', path: '/admin/central-comunicacoes', icon: Bell },\n"
if "Central de Comunicações" not in code:
    code = code.replace("    { name: 'Comunicações', path: '/admin/comunicacoes', icon: Megaphone },", "    { name: 'Comunicações', path: '/admin/comunicacoes', icon: Megaphone },\n" + menu_item)
    
if "Bell," not in code and "import { " in code:
    code = code.replace("lucide-react';", "Bell } from 'lucide-react';")
    # Actually wait, we can just replace "lucide-react';" with "lucide-react';" because we don't know the exact string, let's use regex or just simple replacement.
    
with open('src/components/layout/Layout.tsx', 'w') as f:
    f.write(code)

print("Menu updated")
