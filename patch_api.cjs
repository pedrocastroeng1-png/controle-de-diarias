const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

if (!code.includes('getCurrentUserProfile')) {
  const insertIndex = code.indexOf('export const api = {');
  
  const helperCode = `
const getCurrentUserProfile = () => {
  try {
    const userStr = localStorage.getItem('@diarias:usuario');
    if (userStr) {
      return JSON.parse(userStr).perfil;
    }
  } catch (e) {}
  return null;
};

`;
  
  code = code.substring(0, insertIndex) + helperCode + code.substring(insertIndex);
}

const oldSalvar = `
  salvarPresencas: async (presencas: Array<any>): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    if (!presencas || presencas.length === 0) return;
    
    const { data, error } = await supabase
      .from('presencas')
      .upsert(addEmpresaId(presencas), { onConflict: 'funcionario_id,data' })
      .select();
      
    if (error) throw error;
  },
`;

const newSalvar = `
  salvarPresencas: async (presencas: Array<any>): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    if (!presencas || presencas.length === 0) return;

    const userProfile = getCurrentUserProfile();
    
    if (userProfile === 'CONSULTA') {
      throw new Error('Acesso negado: Usuários com perfil CONSULTA não podem registrar presenças.');
    }

    if (userProfile === 'OPERADOR') {
      for (const p of presencas) {
        if (p.presente && !p.photo_path) {
          throw new Error('Operadores devem obrigatoriamente anexar foto para registrar presença.');
        }
      }
    }
    
    const { data, error } = await supabase
      .from('presencas')
      .upsert(addEmpresaId(presencas), { onConflict: 'funcionario_id,data' })
      .select();
      
    if (error) throw error;
  },
`;

if (code.includes('salvarPresencas: async (presencas: Array<any>): Promise<void> => {')) {
  // It's tricky to string replace safely, let's use regex or split
  const before = code.split('  salvarPresencas: async (presencas: Array<any>): Promise<void> => {')[0];
  const after = code.split('  salvarPresencas: async (presencas: Array<any>): Promise<void> => {')[1];
  const afterBlock = after.substring(after.indexOf('  },') + 4);
  
  code = before + newSalvar.trim() + '\n' + afterBlock;
  fs.writeFileSync('src/lib/api.ts', code);
  console.log("api.ts patched successfully.");
} else {
  console.log("Could not find salvarPresencas.");
}

