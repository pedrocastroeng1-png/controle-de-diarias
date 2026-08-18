const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AutomationsForm.tsx', 'utf-8');

// 1. Add import useAuth
if (!code.includes('useAuth')) {
  code = code.replace(
    "import { api } from '../../lib/api';",
    "import { api } from '../../lib/api';\nimport { useAuth } from '../../contexts/AuthContext';"
  );
}

// 2. Insert useAuth hook
code = code.replace(
  "export default function AutomationsForm({ rule, catalog, onClose, onSave }: AutomationsFormProps) {",
  "export default function AutomationsForm({ rule, catalog, onClose, onSave }: AutomationsFormProps) {\n  const { usuario } = useAuth();"
);

// 3. Rewrite handleTest
const handleTestRegex = /const handleTest = async \(\) => \{[\s\S]*?catch \(error\) \{[\s\S]*?\}\s*\};/;
const newHandleTest = `const handleTest = async () => {
    if (!formData.channels || formData.channels.length === 0) {
      return alert('Selecione pelo menos um canal para enviar o teste.');
    }
    if (!usuario?.id) {
      return alert('Não foi possível identificar o usuário atual.');
    }
    try {
      await api.sendAutomationTest({
        title: formData.title_template || 'Teste de Automação',
        message: formData.message_template || '',
        channels: formData.channels as string[],
        userId: usuario.id
      });
      alert('Teste enviado com sucesso.');
    } catch (error: any) {
      console.error('Erro ao enviar teste:', error);
      if (error.message === 'PUSH_FAILED') {
        alert('Comunicação criada, mas o Push não pôde ser enviado.');
      } else {
        alert(error.message || 'Erro real da operação.');
      }
    }
  };`;

code = code.replace(handleTestRegex, newHandleTest);

fs.writeFileSync('src/pages/admin/AutomationsForm.tsx', code, 'utf-8');
