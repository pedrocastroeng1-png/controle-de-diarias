import { supabase } from './src/lib/supabase';
import { api } from './src/lib/api';

async function test() {
  const adminId = 'd5f7f2b9-7b3b-4c0a-9d0d-9b1b1b1b1b1b'; // dummy? We just need an ID, maybe get first user.
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
    total: 2150 // this should be ignored by API
  };

  const itensData = [
    {
      material_id: materiais[0].id,
      quantidade: 50,
      valor_unitario: 43,
      total_item: 2150 // should be ignored
    }
  ];

  console.log('Testing single item...');
  const res1 = await api.createCompraMaterial(compraData, itensData);
  console.log('res1:', res1.id);
  
  const compra1 = await api.getCompraDetalhes(res1.id);
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
  const res2 = await api.createCompraMaterial(compraData2, itensData2);
  console.log('res2:', res2.id);
  
  const compra2 = await api.getCompraDetalhes(res2.id);
  console.log('Compra 2 details:', {
    itens_count: compra2.itens.length,
    total_calculado: compra2.total_calculado,
    valor_total_item_1: compra2.itens[0].valor_total,
    valor_total_item_2: compra2.itens[1].valor_total
  });
}
test().catch(console.error);
