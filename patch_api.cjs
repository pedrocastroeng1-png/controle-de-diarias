const fs = require('fs');
let apiFile = fs.readFileSync('src/lib/api.ts', 'utf-8');

const newApiMethods = `
  // Controle de Materiais
  getMaterialCategories: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('material_categories')
      .select('*')
      .order('nome');
    if (error) throw error;
    return data || [];
  },

  getMateriais: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('materiais')
      .select('*, category:material_categories(*)')
      .order('nome');
    if (error) throw error;
    return data || [];
  },

  getComprasMateriais: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('compras_materiais')
      .select('*, obra:obras(nome), registrador:usuarios!registrado_por(usuario)')
      .order('data_compra', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  getCompraDetalhes: async (compraId: string): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data: compra, error: compraError } = await supabase
      .from('compras_materiais')
      .select('*, obra:obras(nome), registrador:usuarios!registrado_por(usuario)')
      .eq('id', compraId)
      .single();
    if (compraError) throw compraError;

    const { data: itens, error: itensError } = await supabase
      .from('compras_materiais_itens')
      .select('*, material:materiais(*, category:material_categories(*))')
      .eq('compra_id', compraId);
    if (itensError) throw itensError;

    return { ...compra, itens: itens || [] };
  },

  createCompraMaterial: async (compraData: any, itensData: any[]): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    // Insert compra
    const { data: compra, error: compraError } = await supabase
      .from('compras_materiais')
      .insert(compraData)
      .select()
      .single();
      
    if (compraError) throw compraError;
    
    // Insert items
    if (itensData && itensData.length > 0) {
      const itensToInsert = itensData.map(item => ({
        ...item,
        compra_id: compra.id
      }));
      
      const { error: itensError } = await supabase
        .from('compras_materiais_itens')
        .insert(itensToInsert);
        
      if (itensError) {
        // We shouldn't leave orphaned records, but lacking transaction control
        // we might want to attempt to delete the compra if items fail
        await supabase.from('compras_materiais').delete().eq('id', compra.id);
        throw itensError;
      }
    }
    
    return compra;
  },
};
`;

apiFile = apiFile.replace(/\s*};\s*$/, newApiMethods);
fs.writeFileSync('src/lib/api.ts', apiFile, 'utf-8');
