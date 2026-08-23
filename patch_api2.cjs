const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf-8');

const getComprasRegex = /getComprasMateriais:\s*async\s*\(\):\s*Promise<any\[\]>\s*=>\s*\{[\s\S]*?return data \|\| \[\];\s*\},/;
const getComprasNew = `getComprasMateriais: async (): Promise<any[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    const { data, error } = await supabase
      .from('compras_materiais')
      .select('*, obra:obras(nome), registrador:usuarios!registrado_por(usuario), itens:compras_materiais_itens(valor_total)')
      .order('data_compra', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((compra: any) => ({
      ...compra,
      total_calculado: compra.itens ? compra.itens.reduce((acc: number, item: any) => acc + (Number(item.valor_total) || 0), 0) : 0
    }));
  },`;
code = code.replace(getComprasRegex, getComprasNew);

const getCompraDetalhesRegex = /getCompraDetalhes:\s*async\s*\(compraId:\s*string\):\s*Promise<any>\s*=>\s*\{[\s\S]*?return \{ \.\.\.compra, itens: itens \|\| \[\] \};\s*\},/;
const getCompraDetalhesNew = `getCompraDetalhes: async (compraId: string): Promise<any> => {
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

    const total_calculado = (itens || []).reduce((acc: number, item: any) => acc + (Number(item.valor_total) || 0), 0);
    return { ...compra, itens: itens || [], total_calculado };
  },`;
code = code.replace(getCompraDetalhesRegex, getCompraDetalhesNew);

const createCompraRegex = /createCompraMaterial:\s*async\s*\(compraData:\s*any,\s*itensData:\s*any\[\]\):\s*Promise<any>\s*=>\s*\{[\s\S]*?return compra;\s*\},/;
const createCompraNew = `createCompraMaterial: async (compraData: any, itensData: any[]): Promise<any> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    const { total, total_calculado, ...compraPayload } = compraData;

    // Insert compra
    const { data: compra, error: compraError } = await supabase
      .from('compras_materiais')
      .insert(compraPayload)
      .select()
      .single();
      
    if (compraError) throw compraError;
    
    // Insert items
    if (itensData && itensData.length > 0) {
      const itensToInsert = itensData.map(item => {
        const { total_item, valor_total, ...itemPayload } = item;
        return {
          ...itemPayload,
          compra_id: compra.id
        };
      });
      
      const { error: itensError } = await supabase
        .from('compras_materiais_itens')
        .insert(itensToInsert);
        
      if (itensError) {
        await supabase.from('compras_materiais').delete().eq('id', compra.id);
        throw itensError;
      }
    }
    
    return compra;
  },`;
code = code.replace(createCompraRegex, createCompraNew);

fs.writeFileSync('src/lib/api.ts', code, 'utf-8');
