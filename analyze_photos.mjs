import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
  console.log("Iniciando análise do bucket attendance-photos...");
  let allFiles = [];
  let limit = 1000;
  let offset = 0;
  let hasMore = true;

  // We are using anon key, hopefully it has list permissions on the bucket. Wait, the bucket is private. RLS might block list operations for anon without a valid session.
  // We'll see.
  
  const { data, error } = await supabase.storage.from('attendance-photos').list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'created_at', order: 'asc' },
  });

  if (error) {
    console.error("Erro ao listar arquivos:", error.message);
    return;
  }

  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  let oldFiles = 0;
  let oldSize = 0;
  let newFiles = 0;
  let newSize = 0;

  for (const file of data) {
    if (file.name === '.emptyFolderPlaceholder') continue;
    
    const fileDate = new Date(file.created_at);
    if (fileDate < twentyDaysAgo) {
      oldFiles++;
      oldSize += file.metadata?.size || 0;
    } else {
      newFiles++;
      newSize += file.metadata?.size || 0;
    }
  }

  const mb = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + ' MB';

  console.log('--- RELATÓRIO DE ANÁLISE ---');
  console.log(`Total de arquivos: ${oldFiles + newFiles}`);
  console.log(`Fotos > 20 dias: ${oldFiles} (${mb(oldSize)})`);
  console.log(`Fotos <= 20 dias: ${newFiles} (${mb(newSize)})`);
  console.log('----------------------------');
}

analyze();
