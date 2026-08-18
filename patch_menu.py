import re

with open('src/components/layout/Layout.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_menu_item = "    { name: 'Automações', path: '/admin/automacoes', icon: Bell },\n"
if "Automações" not in content:
    content = content.replace("    { name: 'Relatórios', path: '/admin/relatorios', icon: FileText },\n",
                              "    { name: 'Relatórios', path: '/admin/relatorios', icon: FileText },\n" + new_menu_item)
    # Add Bell icon to imports if missing
    if "Bell" not in content:
        content = re.sub(r'import {([^}]+)FileText([^}]+)} from \'lucide-react\';', r"import {\g<1>FileText, Bell\g<2>} from 'lucide-react';", content)
    with open('src/components/layout/Layout.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched Layout.tsx")
else:
    print("Already patched")
