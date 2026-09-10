const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

const newUpdateItem = `  const updateItem = (id: string, fieldOrUpdates: string | any, value?: any) => {
    setItensForm(prev => prev.map(item => {
      if (item.id === id) {
        let updated = { ...item };
        
        if (typeof fieldOrUpdates === 'string') {
          updated[fieldOrUpdates] = value;
          // Reset material if category changes
          if (fieldOrUpdates === 'categoria_id') {
            updated.material_id = '';
            updated.produto_search = '';
            updated.is_open = false;
            const isEpi = categorias.find((c: any) => c.id === value)?.nome?.trim().toLowerCase() === 'epi';
            if (!isEpi) {
              updated.funcionario_id = null;
            }
          }
        } else {
          updated = { ...updated, ...fieldOrUpdates };
        }
        return updated;
      }
      return item;
    }));
  };`;

content = content.replace(/const updateItem = \([\s\S]*?\}\)\);\n  \};\n/, newUpdateItem + '\n');
fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
