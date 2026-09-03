const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/Funcionarios.tsx', 'utf8');

const anchor = `  const filteredFuncionarios = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );`;

const funcsToAdd = `  const filteredFuncionarios = funcionarios.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredFuncionarios.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredFuncionarios.map(f => f.id));
    }
  };

  const handleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selId => selId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleMassEdit = async () => {
    if (!massEditObraId) {
      alert("Selecione uma obra para alterar.");
      return;
    }
    const confirm = window.confirm(\`Você está prestes a alterar a obra de \${selectedIds.length} funcionários. Deseja continuar?\`);
    if (!confirm) return;

    setMassEditSaving(true);
    setErro('');
    try {
      await api.updateFuncionariosObra(selectedIds, massEditObraId);
      
      // Update local state
      const updated = [...funcionarios];
      selectedIds.forEach(id => {
        const index = updated.findIndex(f => f.id === id);
        if (index > -1) {
          updated[index] = { ...updated[index], obra_id: massEditObraId };
        }
      });
      setFuncionarios(updated);
      
      alert(\`Obra atualizada para \${selectedIds.length} funcionários.\`);
      setSelectedIds([]);
      setShowMassEdit(false);
      setMassEditObraId('');
    } catch (err: any) {
      alert(err.message || "Erro ao atualizar funcionários.");
    } finally {
      setMassEditSaving(false);
    }
  };`;

code = code.replace(anchor, funcsToAdd);
fs.writeFileSync('src/pages/admin/Funcionarios.tsx', code);
