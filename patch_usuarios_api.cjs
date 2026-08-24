const fs = require('fs');
let content = fs.readFileSync('src/pages/owner/Usuarios.tsx', 'utf8');

// 1. Remove bcrypt import
content = content.replace("import bcrypt from 'bcryptjs';\n", "");
content = content.replace("import bcrypt from 'bcryptjs';", "");

// 2. Remove selecting senha
content = content.replace(
  ".select('*, empresas(nome)')",
  ".select('id, nome, usuario, email, perfil, empresa_id, ativo, created_at, updated_at, empresas(nome)')"
);

// 3. Patch handleCreate
const oldHandleCreateStart = "const handleCreate = async (e: React.FormEvent) => {";
const oldHandleCreateEnd = "  const handleOpenEdit = (user: any) => {";

let beforeHandleCreate = content.substring(0, content.indexOf(oldHandleCreateStart));
let afterHandleCreate = content.substring(content.indexOf(oldHandleCreateEnd));

const newHandleCreate = `const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    try {
      if (!newEmpresaId) throw new Error('Selecione uma empresa.');
      if (!newSenha) throw new Error('A senha inicial é obrigatória.');

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error('Não autenticado');

      const res = await fetch('/api/owner/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          nome: newNome,
          usuario: newUsuario,
          email: newEmail,
          empresa_id: newEmpresaId,
          perfil: newPerfil,
          senha: newSenha
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuário');
    } finally {
      setSaving(false);
    }
  };

`;

// 4. Patch handleUpdate
const oldHandleUpdateStart = "const handleUpdate = async (e: React.FormEvent) => {";
const oldHandleUpdateEnd = "  const formatDate = (dateStr: string) => {";

let beforeHandleUpdate = afterHandleCreate.substring(0, afterHandleCreate.indexOf(oldHandleUpdateStart));
let afterHandleUpdate = afterHandleCreate.substring(afterHandleCreate.indexOf(oldHandleUpdateEnd));

const newHandleUpdate = `const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setSaving(true);
    setError('');
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      if (!token) throw new Error('Não autenticado');

      const res = await fetch(\`/api/owner/users/\${selectedUser.id}\`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          ativo: editAtivo
        })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      setShowEditModal(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar usuário');
    } finally {
      setSaving(false);
    }
  };

`;

content = beforeHandleCreate + newHandleCreate + beforeHandleUpdate + newHandleUpdate + afterHandleUpdate;

fs.writeFileSync('src/pages/owner/Usuarios.tsx', content);
