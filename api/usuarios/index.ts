import { normalizeWhatsAppPhone } from "../../src/lib/whatsapp-phone.js";
import bcrypt from "bcryptjs";
import {
  authorize,
  checkDb,
  HttpError,
  uuid,
} from "../../server/session.js";

// Catálogo padrão de permissões (utilizado caso a tabela pceg_private.permissoes_catalogo não retorne registros)
const DEFAULT_PERMISSOES_CATALOGO = [
  { codigo: "DASHBOARD_VER", nome: "Visualizar Dashboard", modulo: "Geral", descricao: "Acesso aos indicadores do dashboard" },
  { codigo: "OBRAS_VER", nome: "Visualizar Obras", modulo: "Obras", descricao: "Listar e visualizar dados das obras" },
  { codigo: "OBRAS_GERENCIAR", nome: "Gerenciar Obras", modulo: "Obras", descricao: "Criar e editar dados de obras" },
  { codigo: "FUNCIONARIOS_VER", nome: "Visualizar Funcionários", modulo: "Funcionários", descricao: "Listar funcionários e cargos" },
  { codigo: "FUNCIONARIOS_GERENCIAR", nome: "Gerenciar Funcionários", modulo: "Funcionários", descricao: "Cadastrar, editar e inativar funcionários" },
  { codigo: "PRESENCAS_VER", nome: "Visualizar Presenças", modulo: "Presenças", descricao: "Consultar lista de presenças diárias" },
  { codigo: "PRESENCAS_REGISTRAR", nome: "Registrar Presenças", modulo: "Presenças", descricao: "Lançar presenças e meias diárias em campo" },
  { codigo: "ATESTADOS_GERENCIAR", nome: "Gerenciar Atestados", modulo: "Presenças", descricao: "Registrar e aprovar atestados médicos" },
  { codigo: "FERRAMENTAS_VER", nome: "Visualizar Ferramentas", modulo: "Ferramentas", descricao: "Consultar inventário de ferramentas" },
  { codigo: "FERRAMENTAS_OPERAR", nome: "Emprestar/Devolver Ferramentas", modulo: "Ferramentas", descricao: "Registrar movimentações de ferramentas" },
  { codigo: "MATERIAIS_VER", nome: "Visualizar Materiais", modulo: "Materiais", descricao: "Consultar estoque e compras de materiais" },
  { codigo: "MATERIAIS_GERENCIAR", nome: "Gerenciar Materiais", modulo: "Materiais", descricao: "Registrar compras e movimentações de estoque" },
  { codigo: "RELATORIOS_VER", nome: "Visualizar Relatórios", modulo: "Relatórios", descricao: "Acesso a relatórios de diárias e folhas" },
  { codigo: "USUARIOS_GERENCIAR", nome: "Gerenciar Usuários", modulo: "Administração", descricao: "Cadastrar usuários e configurar permissões" },
];

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST", "PATCH"].includes(req.method)) {
    return res.status(405).json({ error: "Método não permitido." });
  }

  try {
    // Acesso restrito a administradores ativos da empresa
    const { db, user } = await authorize(req, true);

    if (req.method === "GET") {
      // 1. Obter usuários da empresa (sem a coluna de senha)
      const { data: rawUsers, error: usersErr } = await db
        .from("usuarios")
        .select("id, empresa_id, nome, usuario, login, email, telefone, perfil, ativo, tipo_usuario, arquivado, arquivado_em, created_at, updated_at")
        .eq("empresa_id", user.empresa_id)
        .order("nome", { ascending: true });
      checkDb(usersErr);

      // 2. Obter obras ativas da empresa
      const { data: obras, error: obrasErr } = await db
        .from("obras")
        .select("id, nome, ativo")
        .eq("empresa_id", user.empresa_id)
        .order("nome", { ascending: true });
      checkDb(obrasErr);

      // 3. Obter catálogo de permissões de pceg_private
      let catalogo = DEFAULT_PERMISSOES_CATALOGO;
      try {
        const { data: dbCatalogo, error: catErr } = await db
          .schema("pceg_private")
          .from("permissoes_catalogo")
          .select("*")
          .eq("ativo", true);
        if (!catErr && dbCatalogo && dbCatalogo.length > 0) {
          catalogo = dbCatalogo.map((c: any) => ({
            id: c.id || c.codigo,
            codigo: c.codigo || c.id || c.chave,
            nome: c.nome || c.titulo || c.descricao || c.codigo,
            descricao: c.descricao || "",
            modulo: c.modulo || c.categoria || "Geral",
            perfil_padrao: c.perfil_padrao || [],
            ativo: c.ativo !== false,
          }));
        }
      } catch {
        // Usa DEFAULT_PERMISSOES_CATALOGO
      }

      // 4. Obter acessos e permissões por usuário de pceg_private.usuario_acessos
      let acessosMap: Record<string, any> = {};
      try {
        const { data: acessos, error: acErr } = await db
          .schema("pceg_private")
          .from("usuario_acessos")
          .select("*")
          .eq("empresa_id", user.empresa_id);
        if (!acErr && Array.isArray(acessos)) {
          for (const a of acessos) {
            acessosMap[a.usuario_id] = a;
          }
        }
      } catch {
        // Sem tabela acessos pré-configurada ainda
      }

      // 5. Obter obras vinculadas de pceg_private.usuario_obras
      let usuarioObrasMap: Record<string, string[]> = {};
      try {
        const { data: uObras, error: uoErr } = await db
          .schema("pceg_private")
          .from("usuario_obras")
          .select("usuario_id, obra_id");
        if (!uoErr && Array.isArray(uObras)) {
          for (const row of uObras) {
            if (!usuarioObrasMap[row.usuario_id]) usuarioObrasMap[row.usuario_id] = [];
            usuarioObrasMap[row.usuario_id].push(row.obra_id);
          }
        }
      } catch {
        // Sem vínculo ainda
      }

      // Mesclar informações de usuário
      const usuarios = (rawUsers || []).map((u: any) => {
        const ac = acessosMap[u.id];
        const obrasIds = usuarioObrasMap[u.id] || [];
        return {
          ...u,
          modo_permissoes: ac?.modo_permissoes || "PADRAO_PERFIL",
          acesso_obras_tipo: ac?.acesso_obras_tipo || (obrasIds.length > 0 ? "SELECIONADAS" : "TODAS"),
          obras_ids: obrasIds,
          permissoes: Array.isArray(ac?.permissoes) ? ac.permissoes : [],
        };
      });

      return res.status(200).json({
        usuarios,
        obras: obras || [],
        permissoes_catalogo: catalogo,
      });
    }

    const b = req.body || {};
    let telefone: string | null | undefined;
    if (Object.prototype.hasOwnProperty.call(b, "telefone")) {
      try { telefone = normalizeWhatsAppPhone(b.telefone); }
      catch (error) { throw new HttpError(400, (error as Error).message); }
    }
    const action = b.action || (req.method === "PATCH" ? "update" : "create");

    // ==========================================
    // ACTION: TOGGLE STATUS / ARQUIVAR / INATIVAR
    // ==========================================
    if (action === "toggle_status" || action === "archive") {
      const targetId = b.id;
      if (!uuid(targetId)) throw new HttpError(400, "Identificador de usuário inválido.");

      const { data: targetUser, error: tErr } = await db
        .from("usuarios")
        .select("id, perfil, ativo, usuario, login, nome")
        .eq("empresa_id", user.empresa_id)
        .eq("id", targetId)
        .maybeSingle();
      checkDb(tErr);
      if (!targetUser) throw new HttpError(404, "Usuário não encontrado.");

      const newAtivo = typeof b.ativo === "boolean" ? b.ativo : !targetUser.ativo;

      // Regra de segurança: Não reativar Carlos se marcado como inativo por restrição
      if (newAtivo && (targetUser.login?.toLowerCase() === "carlos" || targetUser.usuario?.toLowerCase() === "carlos")) {
        throw new HttpError(400, "O usuário Carlos permanece inativo por determinação do sistema.");
      }

      // Regra de segurança: Proteção do último administrador ativo da empresa
      if (!newAtivo && targetUser.perfil === "ADMIN") {
        const { count, error: countErr } = await db
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", user.empresa_id)
          .eq("perfil", "ADMIN")
          .eq("ativo", true);
        checkDb(countErr);

        if ((count || 0) <= 1) {
          throw new HttpError(400, "Não é permitido inativar o único administrador ativo da empresa.");
        }
      }

      // Executar exclusão lógica (arquivamento) - NUNCA hard delete
      const updateData: any = {
        ativo: newAtivo,
        arquivado: !newAtivo,
        arquivado_em: newAtivo ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await db
        .from("usuarios")
        .update(updateData)
        .eq("empresa_id", user.empresa_id)
        .eq("id", targetId);
      checkDb(updErr);

      return res.status(200).json({
        success: true,
        id: targetId,
        ativo: newAtivo,
        message: newAtivo ? "Usuário ativado com sucesso." : "Usuário inativado e arquivado com sucesso.",
      });
    }

    // ==========================================
    // ACTION: CREATE
    // ==========================================
    if (action === "create") {
      const nome = typeof b.nome === "string" ? b.nome.trim() : "";
      const login = typeof b.login === "string" ? b.login.trim().toLowerCase() : "";
      const email = typeof b.email === "string" && b.email.trim() ? b.email.trim().toLowerCase() : null;
      const perfil = b.perfil;
      const senha = typeof b.senha === "string" ? b.senha : "";
      const modoPermissoes = b.modo_permissoes === "PERSONALIZADO" ? "PERSONALIZADO" : "PADRAO_PERFIL";
      const acessoObrasTipo = b.acesso_obras_tipo === "SELECIONADAS" ? "SELECIONADAS" : "TODAS";
      const obrasIds = Array.isArray(b.obras_ids) ? b.obras_ids.filter((id: any) => uuid(id)) : [];
      const permissoes = Array.isArray(b.permissoes) ? b.permissoes.map(String) : [];

      if (!nome || nome.length < 2 || nome.length > 160) {
        throw new HttpError(400, "Nome deve ter entre 2 e 160 caracteres.");
      }
      if (!login || login.length < 3 || login.length > 60 || !/^[a-z0-9_.-]+$/.test(login)) {
        throw new HttpError(400, "Login deve conter apenas letras minúsculas, números, ponto ou traço (3 a 60 caracteres).");
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, "E-mail com formato inválido.");
      }
      if (!["ADMIN", "OPERADOR", "CONSULTA"].includes(perfil)) {
        throw new HttpError(400, "Perfil de acesso inválido.");
      }
      if (!senha || senha.length < 6) {
        throw new HttpError(400, "Senha provisória deve ter no mínimo 6 caracteres.");
      }

      // Verificar unicidade de login na empresa
      const { data: existing, error: existErr } = await db
        .from("usuarios")
        .select("id")
        .eq("empresa_id", user.empresa_id)
        .or(`login.eq.${login},usuario.eq.${login}`)
        .maybeSingle();
      checkDb(existErr);
      if (existing) {
        throw new HttpError(400, "Já existe um usuário cadastrado com este login na empresa.");
      }

      // Criptografar senha usando bcrypt
      const senhaHash = await bcrypt.hash(senha, 10);

      const novoUsuario = {
        empresa_id: user.empresa_id,
        nome,
        usuario: login,
        login,
        email,
        telefone: telefone ?? null,
        perfil,
        senha: senhaHash,
        ativo: true,
        tipo_usuario: perfil === "ADMIN" ? "GESTOR" : "OPERADOR",
        arquivado: false,
        arquivado_em: null,
      };

      const { data: createdUser, error: insErr } = await db
        .from("usuarios")
        .insert([novoUsuario])
        .select("id, empresa_id, nome, usuario, login, email, telefone, perfil, ativo, tipo_usuario, created_at, updated_at")
        .single();
      checkDb(insErr);
      if (!createdUser) throw new HttpError(500, "Erro ao registrar usuário.");

      const newUserId = createdUser.id;

      // Salvar permissões e acessos em pceg_private
      try {
        await db
          .schema("pceg_private")
          .from("usuario_acessos")
          .upsert({
            usuario_id: newUserId,
            empresa_id: user.empresa_id,
            modo_permissoes: modoPermissoes,
            acesso_obras_tipo: acessoObrasTipo,
            permissoes: modoPermissoes === "PERSONALIZADO" ? permissoes : [],
            updated_at: new Date().toISOString(),
          }, { onConflict: "usuario_id" });
      } catch {
        // Continua mesmo se tabela ainda não tiver RLS liberado
      }

      // Salvar obras vinculadas
      try {
        await db
          .schema("pceg_private")
          .from("usuario_obras")
          .delete()
          .eq("usuario_id", newUserId);

        if (acessoObrasTipo === "SELECIONADAS" && obrasIds.length > 0) {
          const obrasRows = obrasIds.map((oId: string) => ({
            usuario_id: newUserId,
            obra_id: oId,
            empresa_id: user.empresa_id,
          }));
          await db
            .schema("pceg_private")
            .from("usuario_obras")
            .insert(obrasRows);
        }
      } catch {
        // Continua
      }

      return res.status(201).json({
        ...createdUser,
        modo_permissoes: modoPermissoes,
        acesso_obras_tipo: acessoObrasTipo,
        obras_ids: acessoObrasTipo === "SELECIONADAS" ? obrasIds : [],
        permissoes: modoPermissoes === "PERSONALIZADO" ? permissoes : [],
      });
    }

    // ==========================================
    // ACTION: UPDATE
    // ==========================================
    if (action === "update") {
      const targetId = b.id;
      if (!uuid(targetId)) throw new HttpError(400, "Identificador de usuário inválido.");

      const { data: currentTarget, error: curErr } = await db
        .from("usuarios")
        .select("*")
        .eq("empresa_id", user.empresa_id)
        .eq("id", targetId)
        .maybeSingle();
      checkDb(curErr);
      if (!currentTarget) throw new HttpError(404, "Usuário não encontrado.");

      const nome = typeof b.nome === "string" ? b.nome.trim() : currentTarget.nome;
      const login = typeof b.login === "string" ? b.login.trim().toLowerCase() : currentTarget.login;
      const email = typeof b.email === "string" ? (b.email.trim() ? b.email.trim().toLowerCase() : null) : currentTarget.email;
      const perfil = b.perfil || currentTarget.perfil;
      const senha = typeof b.senha === "string" && b.senha.trim() ? b.senha.trim() : null;
      const modoPermissoes = b.modo_permissoes === "PERSONALIZADO" ? "PERSONALIZADO" : "PADRAO_PERFIL";
      const acessoObrasTipo = b.acesso_obras_tipo === "SELECIONADAS" ? "SELECIONADAS" : "TODAS";
      const obrasIds = Array.isArray(b.obras_ids) ? b.obras_ids.filter((id: any) => uuid(id)) : [];
      const permissoes = Array.isArray(b.permissoes) ? b.permissoes.map(String) : [];

      if (!nome || nome.length < 2 || nome.length > 160) {
        throw new HttpError(400, "Nome deve ter entre 2 e 160 caracteres.");
      }
      if (!login || login.length < 3 || login.length > 60 || !/^[a-z0-9_.-]+$/.test(login)) {
        throw new HttpError(400, "Login deve conter apenas letras minúsculas, números, ponto ou traço.");
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new HttpError(400, "E-mail com formato inválido.");
      }
      if (!["ADMIN", "OPERADOR", "CONSULTA"].includes(perfil)) {
        throw new HttpError(400, "Perfil de acesso inválido.");
      }
      if (senha && senha.length < 6) {
        throw new HttpError(400, "Nova senha deve ter no mínimo 6 caracteres.");
      }

      // Regra de segurança: Se o usuário é ADMIN e está sendo alterado para outro perfil
      if (currentTarget.perfil === "ADMIN" && perfil !== "ADMIN") {
        const { count, error: countErr } = await db
          .from("usuarios")
          .select("id", { count: "exact", head: true })
          .eq("empresa_id", user.empresa_id)
          .eq("perfil", "ADMIN")
          .eq("ativo", true);
        checkDb(countErr);

        if ((count || 0) <= 1) {
          throw new HttpError(400, "A empresa precisa manter pelo menos um administrador ativo.");
        }
      }

      // Verificar unicidade de login (se alterado)
      if (login !== currentTarget.login && login !== currentTarget.usuario) {
        const { data: existing, error: existErr } = await db
          .from("usuarios")
          .select("id")
          .eq("empresa_id", user.empresa_id)
          .neq("id", targetId)
          .or(`login.eq.${login},usuario.eq.${login}`)
          .maybeSingle();
        checkDb(existErr);
        if (existing) {
          throw new HttpError(400, "Este login já está em uso por outro colaborador na empresa.");
        }
      }

      const updatePayload: any = {
        nome,
        usuario: login,
        login,
        email,
        perfil,
        tipo_usuario: perfil === "ADMIN" ? "GESTOR" : "OPERADOR",
        updated_at: new Date().toISOString(),
      };

      if (telefone !== undefined) updatePayload.telefone = telefone;

      if (senha) {
        updatePayload.senha = await bcrypt.hash(senha, 10);
      }

      const { data: updatedUser, error: updErr } = await db
        .from("usuarios")
        .update(updatePayload)
        .eq("empresa_id", user.empresa_id)
        .eq("id", targetId)
        .select("id, empresa_id, nome, usuario, login, email, telefone, perfil, ativo, tipo_usuario, created_at, updated_at")
        .single();
      checkDb(updErr);
      if (!updatedUser) throw new HttpError(500, "Erro ao atualizar dados do usuário.");

      // Atualizar acessos e permissões em pceg_private
      try {
        await db
          .schema("pceg_private")
          .from("usuario_acessos")
          .upsert({
            usuario_id: targetId,
            empresa_id: user.empresa_id,
            modo_permissoes: modoPermissoes,
            acesso_obras_tipo: acessoObrasTipo,
            permissoes: modoPermissoes === "PERSONALIZADO" ? permissoes : [],
            updated_at: new Date().toISOString(),
          }, { onConflict: "usuario_id" });
      } catch {
        // Continua
      }

      // Atualizar obras vinculadas
      try {
        await db
          .schema("pceg_private")
          .from("usuario_obras")
          .delete()
          .eq("usuario_id", targetId);

        if (acessoObrasTipo === "SELECIONADAS" && obrasIds.length > 0) {
          const obrasRows = obrasIds.map((oId: string) => ({
            usuario_id: targetId,
            obra_id: oId,
            empresa_id: user.empresa_id,
          }));
          await db
            .schema("pceg_private")
            .from("usuario_obras")
            .insert(obrasRows);
        }
      } catch {
        // Continua
      }

      return res.status(200).json({
        ...updatedUser,
        modo_permissoes: modoPermissoes,
        acesso_obras_tipo: acessoObrasTipo,
        obras_ids: acessoObrasTipo === "SELECIONADAS" ? obrasIds : [],
        permissoes: modoPermissoes === "PERSONALIZADO" ? permissoes : [],
      });
    }

    throw new HttpError(400, "Ação não reconhecida.");
  } catch (err: any) {
    const status = err instanceof HttpError ? err.status : 500;
    return res.status(status).json({
      error: err.message || "Ocorreu um erro ao processar os dados do usuário.",
    });
  }
}
