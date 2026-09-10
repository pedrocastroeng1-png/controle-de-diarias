const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// Add funcionarios state
content = content.replace(
  "const [fornecedores, setFornecedores] = useState<any[]>([]);",
  "const [fornecedores, setFornecedores] = useState<any[]>([]);\n  const [funcionarios, setFuncionarios] = useState<any[]>([]);"
);

// Add useEffect for funcionarios
content = content.replace(
  "// Search",
  `useEffect(() => {
    if (compraForm.obra_id) {
      api.getFuncionariosPorObra(compraForm.obra_id).then(setFuncionarios).catch(console.error);
    } else {
      setFuncionarios([]);
    }
    
    // Clear EPI employees when work changes
    setItensForm(prev => prev.map(item => ({ ...item, funcionario_id: null })));
  }, [compraForm.obra_id]);

  // Search`
);

// Add funcionario_id to new items
content = content.replace(
  "{ id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0 }",
  "{ id: Date.now().toString(), categoria_id: '', material_id: '', quantidade: 1, valor_unitario: 0, funcionario_id: null }"
);

// Update updateItem
content = content.replace(
  `        if (field === 'categoria_id') {
          updated.material_id = '';
        }`,
  `        if (field === 'categoria_id') {
          updated.material_id = '';
          const isEpi = categorias.find((c: any) => c.id === value)?.nome?.trim().toLowerCase() === 'epi';
          if (!isEpi) {
            updated.funcionario_id = null;
          }
        }`
);

// Remove observacao from init state
content = content.replace(/observacao: ''\s*\}\);/g, "}\);\n");
content = content.replace(/observacao: ''/g, "");

// Modify form render to hide observation and add funcionario
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
