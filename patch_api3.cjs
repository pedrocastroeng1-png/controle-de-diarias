const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

const newMethod = `
  getMaterialQuantities: async (filters?: { obra_id?: string; categoria_id?: string; material_id?: string; data_inicial?: string; data_final?: string }): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    let query = supabase
      .from('compras_materiais_itens')
      .select(\`
        id,
        quantidade,
        valor_unitario,
        valor_total,
        compra:compras_materiais!inner(id, data_compra, fornecedor, obra_id, obra:obras(nome)),
        material:materiais!inner(id, nome, unidade, categoria_id, category:material_categories(nome))
      \`);

    if (filters?.obra_id) {
      query = query.eq('compra.obra_id', filters.obra_id);
    }
    if (filters?.categoria_id) {
      query = query.eq('material.categoria_id', filters.categoria_id);
    }
    if (filters?.material_id) {
      query = query.eq('material_id', filters.material_id);
    }
    if (filters?.data_inicial) {
      query = query.gte('compra.data_compra', filters.data_inicial);
    }
    if (filters?.data_final) {
      query = query.lte('compra.data_compra', filters.data_final);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Agregação no frontend
    const map = new Map<string, any>();
    
    for (const item of (data || [])) {
      const matId = item.material.id;
      const obraId = item.compra.obra_id;
      // If we are showing "Todas as Obras", we might want to aggregate by Material AND Obra, 
      // or just by Material? 
      // The requirement says: "Se OBRA = Todas as Obras, mostrar: OBRA | MATERIAL | UNIDADE | QUANTIDADE"
      // So the grouping key must be obra_id + material_id
      const key = \`\${obraId}_\${matId}\`;
      
      if (!map.has(key)) {
        map.set(key, {
          material_id: matId,
          material_nome: item.material.nome,
          unidade: item.material.unidade,
          categoria_id: item.material.categoria_id,
          categoria_nome: item.material.category?.nome,
          obra_id: obraId,
          obra_nome: item.compra.obra?.nome || 'N/A',
          quantidade_total: 0,
          registros: []
        });
      }
      
      const row = map.get(key);
      row.quantidade_total += Number(item.quantidade) || 0;
      row.registros.push({
        id: item.id,
        data_compra: item.compra.data_compra,
        fornecedor: item.compra.fornecedor,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_total: item.valor_total
      });
    }
    
    return Array.from(map.values()).sort((a, b) => a.material_nome.localeCompare(b.material_nome));
  },
`;

code = code.replace(/createCompraMaterial: async/, newMethod + '\n  createCompraMaterial: async');
fs.writeFileSync('src/lib/api.ts', code, 'utf-8');
