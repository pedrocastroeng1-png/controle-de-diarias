const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts', 'utf8');

const oldFunc = `salvarPresencas: async (presencas: Array<any>): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    if (!presencas || presencas.length === 0) return [];

    const empId = getEmpresaId();
    if (!empId) {
      throw new Error("Contexto da empresa não encontrado. Faça login novamente para registrar a presença.");
    }

    const userProfile = getCurrentUserProfile();`;

const newFunc = `salvarPresencas: async (presencas: Array<any>, empresaIdContext?: string): Promise<any[]> => {
    if (!supabase) throw new Error("Supabase não configurado");
    if (!presencas || presencas.length === 0) return [];

    let usuarioId = "unknown";
    try {
      const uStr = localStorage.getItem("@diarias:usuario");
      if (uStr) {
        const u = JSON.parse(uStr);
        usuarioId = u.id;
      }
    } catch(e) {}

    const userProfile = getCurrentUserProfile();
    const empresaIdDoUsuario = empresaIdContext || getEmpresaId();
    const empresaIdDoPayload = presencas[0]?.empresa_id;

    console.log("Validação de Contexto (salvarPresencas):", {
      usuarioId,
      perfil: userProfile,
      empresaIdDoUsuario,
      empresaIdDoPayload: empresaIdDoPayload || "NÃO_INFORMADO"
    });

    if (empresaIdDoPayload && empresaIdDoUsuario && empresaIdDoPayload !== empresaIdDoUsuario) {
      console.error("Conflito de empresa_id! Abortando.", { empresaIdDoUsuario, empresaIdDoPayload });
      throw new Error("Conflito de contexto de empresa. Atualize sua sessão.");
    }

    const empresaIdReal = empresaIdDoUsuario || empresaIdDoPayload;
    if (!empresaIdReal) {
      throw new Error("Contexto da empresa não encontrado. Faça login novamente para registrar a presença.");
    }`;

// Reemplazo del comienzo de la funcion
code = code.replace(oldFunc, newFunc);

// Reemplazar upsert(addEmpresaId(...)) por algo seguro
const oldUpsert = `.upsert(addEmpresaId(presencas), { onConflict: "funcionario_id,data" })`;
const newUpsert = `.upsert(
        presencas.map(p => ({ ...p, empresa_id: empresaIdReal })),
        { onConflict: "funcionario_id,data" }
      )`;

code = code.replace(oldUpsert, newUpsert);

fs.writeFileSync('src/lib/api.ts', code);
