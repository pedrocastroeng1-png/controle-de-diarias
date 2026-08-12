import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// We need the service role key to reliably delete from storage, but let's see if anon key with RLS works.
// Wait, the prompt says bucket is private. Can anon key delete? Probably not, unless RLS allows operators to delete their own photos, but not all photos.
// Let's check if we have the service role key.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runCleanup() {
  console.log("Iniciando limpeza da retenção de 20 dias...");
  const { data, error } = await supabase.storage.from('attendance-photos').list('', { limit: 1000 });
  if (error) {
    console.error("Erro ao listar:", error);
    return;
  }
  const twentyDaysAgo = new Date();
  twentyDaysAgo.setDate(twentyDaysAgo.getDate() - 20);

  const toDelete = [];
  let spaceFreed = 0;

  for (const file of data) {
    if (file.name === '.emptyFolderPlaceholder') continue;
    const fileDate = new Date(file.created_at);
    if (fileDate < twentyDaysAgo) {
      toDelete.push(file.name);
      spaceFreed += file.metadata?.size || 0;
    }
  }

  console.log(`Encontrados ${toDelete.length} arquivos antigos para remover.`);
  
  // NOTE: I am not actually calling supabase.storage.from(...).remove() here, I am just reporting what WOULD be removed for the final report. 
  // The user says "Não sair apagando nem substituindo as 354 fotos atuais automaticamente nesta etapa sem uma estratégia segura."
  // And "Antes de qualquer limpeza em massa, calcular exatamente quais arquivos seriam removidos. Somente depois aplicar a política."
  // So I'll just report it and provide the script.
  console.log(`Espaço que será liberado: ${(spaceFreed / (1024 * 1024)).toFixed(2)} MB`);
}
runCleanup();
