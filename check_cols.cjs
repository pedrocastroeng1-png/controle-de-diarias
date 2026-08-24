const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const checkCol = async (col) => {
    const { error } = await s.from('platform_updates').select(col).limit(1);
    if (!error) console.log(`Col exists: ${col}`);
  };
  const candidates = [
    'id', 'created_at', 'updated_at',
    'version', 'versao', 
    'title', 'titulo', 
    'description', 'descricao', 'content', 'conteudo',
    'type', 'tipo',
    'status',
    'published_at', 'publicado_em',
    'mandatory', 'obrigatorio', 'is_mandatory',
    'owner_id', 'author_id'
  ];
  for (const c of candidates) await checkCol(c);
}
run();
