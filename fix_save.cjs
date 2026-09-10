const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/ComprasMateriaisTab.tsx', 'utf8');

// Replace validation loop
content = content.replace(
  /for \(let i = 0; i < itensForm\.length; i\+\+\) \{[\s\S]*?itensValidos\.push\(\{[\s\S]*?material_id: item\.material_id,[\s\S]*?quantidade: item\.quantidade,[\s\S]*?valor_unitario: item\.valor_unitario[\s\S]*?\}\);[\s\S]*?\}/,
  `for (let i = 0; i < itensForm.length; i++) {
      const item = itensForm[i];
      if (!item.material_id) return setFormError(\`Selecione o produto para o item \${i + 1}.\`);
      if (item.quantidade <= 0) return setFormError(\`A quantidade do item \${i + 1} deve ser maior que zero.\`);
      if (item.valor_unitario < 0) return setFormError(\`O valor unitário do item \${i + 1} não pode ser negativo.\`);
      
      const isEpi = categorias.find((c: any) => c.id === item.categoria_id)?.nome?.trim().toLowerCase() === 'epi';
      if (isEpi && !item.funcionario_id) {
        return setFormError(\`Para materiais EPI (Item \${i + 1}), selecione o funcionário.\`);
      }
      
      itensValidos.push({
        material_id: item.material_id,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        funcionario_id: isEpi ? item.funcionario_id : null
      });
    }`
);

fs.writeFileSync('src/pages/admin/ComprasMateriaisTab.tsx', content);
