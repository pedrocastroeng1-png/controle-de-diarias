require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function createCompraMaterial(compraData, itensData) {
    const { total, total_calculado, ...compraPayload } = compraData;

    const { data: compra, error: compraError } = await supabase
      .from('compras_materiais')
      .insert(compraPayload)
      .select()
      .single();
      
    if (compraError) throw compraError;
    
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
}

async function getCompraDetalhes(compraId) {
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

    const total_calculado = (itens || []).reduce((acc, item) => acc + (Number(item.valor_total) || 0), 0);
    return { ...compra, itens: itens || [], total_calculado };
}

async function test() {
  const { data: users } = await supabase.from('usuarios').select('id').limit(1);
  const userId = users?.[0]?.id;

  const { data: obras } = await supabase.from('obras').select('id').limit(1);
  const obraId = obras?.[0]?.id;

  const { data: materiais } = await supabase.from('materiais').select('id, categoria_id, nome').limit(2);
  
  if (!userId || !obraId || !materiais || materiais.length < 2) {
    console.log('Missing basic test data');
    return;
  }

  const compraData = {
    data_compra: '2026-08-23',
    obra_id: obraId,
    fornecedor: 'teste',
    numero_recibo: '1',
    observacao: 'teste',
    registrado_por: userId,
    total: 2150 
  };

  const itensData = [
    {
      material_id: materiais[0].id,
      quantidade: 50,
      valor_unitario: 43,
      total_item: 2150 
    }
  ];

  console.log('Testing single item...');
  const res1 = await createCompraMaterial(compraData, itensData);
  console.log('res1:', res1.id);
  
  const compra1 = await getCompraDetalhes(res1.id);
  console.log('Compra 1 details:', {
    itens_count: compra1.itens.length,
    total_calculado: compra1.total_calculado,
    valor_total_item_1: compra1.itens[0].valor_total
  });

  const compraData2 = {
    ...compraData,
    total: 2750
  };
  const itensData2 = [
    {
      material_id: materiais[0].id,
      quantidade: 50,
      valor_unitario: 43
    },
    {
      material_id: materiais[1].id,
      quantidade: 20,
      valor_unitario: 30
    }
  ];
  
  console.log('Testing multiple items...');
  const res2 = await createCompraMaterial(compraData2, itensData2);
  console.log('res2:', res2.id);
  
  const compra2 = await getCompraDetalhes(res2.id);
  console.log('Compra 2 details:', {
    itens_count: compra2.itens.length,
    total_calculado: compra2.total_calculado,
    valor_total_item_1: compra2.itens[0].valor_total,
    valor_total_item_2: compra2.itens[1].valor_total
  });
}
test().catch(console.error);
