import bcrypt from "bcryptjs";
import { timingSafeEqual, createHash, createHmac } from "node:crypto";
import {
  database,
  signSession,
  HttpError,
  fail,
} from "../../server/session.js";

export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { usuario, senha } = req.body || {};
    if (
      typeof usuario !== "string" ||
      !usuario.trim() ||
      usuario.length > 200 ||
      typeof senha !== "string" ||
      !senha ||
      senha.length > 256
    )
      throw new HttpError(400, "Informe usuário e senha válidos.");
    const db = database();
    const limiterKey = createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY!).update('login:' + usuario.trim().toLowerCase()).digest('hex');
    const { data: allowed, error: limitError } = await db.rpc('limitar_login', {p_chave: limiterKey});
    if (limitError) throw new HttpError(503, 'Não foi possível validar o acesso.');
    if (!allowed) { res.setHeader('Retry-After', '900'); throw new HttpError(429, 'Muitas tentativas. Aguarde até 15 minutos para tentar novamente.'); }
    // Filter values are passed through eq separately; user input never enters PostgREST filter syntax.
    const results = await Promise.all(
      ["usuario", "login", "email"].map((field) =>
        db
          .from("usuarios")
          .select("id,usuario,nome,perfil,senha,empresa_id,ativo,email,login")
          .eq(field, usuario.trim())
          .eq("ativo", true)
          .limit(2),
      ),
    );
    if (results.some((r) => r.error))
      throw new HttpError(503, "Não foi possível validar o acesso.");
    const users = [
      ...new Map(
        results.flatMap((r) => r.data || []).map((u) => [u.id, u]),
      ).values(),
    ];
    const user = users.length === 1 ? users[0] : null;
    const hash = user?.senha || "";
    const valid = /^\$2[aby]\$/.test(hash)
      ? await bcrypt.compare(senha, hash)
      : Boolean(hash) &&
        timingSafeEqual(
          createHash("sha256").update(senha).digest(),
          createHash("sha256").update(hash).digest(),
        );
    if (!user || !valid)
      throw new HttpError(401, "Usuário ou senha inválidos.");
    const { data: company } = await db
      .from("empresas")
      .select("ativo")
      .eq("id", user.empresa_id)
      .single();
    if (
      !company?.ativo ||
      !["ADMIN", "OPERADOR", "CONSULTA"].includes(user.perfil)
    )
      throw new HttpError(403, "Acesso não permitido.");
    const { senha: ignored, ...publicUser } = user;
    return res.status(200).json({ token: signSession(user), user: publicUser });
  } catch (e) {
    return fail(res, e);
  }
}
