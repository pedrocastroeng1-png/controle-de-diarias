import re

with open('src/pages/admin/CentralComunicacoes.tsx', 'r') as f:
    content = f.read()

content = content.replace("function SugestaoCard({ sugestao, onUpdate }: { sugestao: any, onUpdate: () => void | Promise<void> }) {", "function SugestaoCard({ sugestao, onUpdate }: { sugestao: any, onUpdate: () => void | Promise<void> }) {\n  const { usuario } = useAuth();")
content = content.replace("function NovaComunicacaoTab() {", "function NovaComunicacaoTab() {\n  const { usuario } = useAuth();")

if "useAuth" not in content:
    content = content.replace("import { api } from '../../lib/api';", "import { api } from '../../lib/api';\nimport { useAuth } from '../../contexts/AuthContext';")

with open('src/pages/admin/CentralComunicacoes.tsx', 'w') as f:
    f.write(content)

