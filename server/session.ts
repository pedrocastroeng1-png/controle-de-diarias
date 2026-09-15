import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "node:crypto";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const uuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
function secret() {
  const s =
    process.env.JWT_SECRET ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY)
          .update("pceg-session-v1")
          .digest("hex")
      : undefined);
  if (!s || s.length < 32)
    throw new HttpError(503, "Sessão do servidor não configurada.");
  return s;
}
export function database() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new HttpError(503, "Acesso do servidor ao banco não configurado.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
function signature(s: string) {
  return createHmac("sha256", secret()).update(s).digest("base64url");
}
export function passwordVersion(hash: string) {
  return signature("password:" + hash);
}
export function signSession(
  user: { id: string; empresa_id: string; senha: string },
  now = Date.now(),
) {
  const body = Buffer.from(
    JSON.stringify({
      sub: user.id,
      empresa: user.empresa_id,
      ver: passwordVersion(user.senha),
      exp: Math.floor(now / 1000) + 28800,
      audience: "pceg-cadastros-v1",
    }),
  ).toString("base64url");
  return body + "." + signature(body);
}
export function verifySession(token: string, now = Date.now()) {
  if (token.length > 2048)
    throw new HttpError(401, "Sessão inválida. Entre novamente.");
  const [body, sig, extra] = token.split(".");
  const expected = Buffer.from(signature(body || ""));
  const received = Buffer.from(sig || "");
  if (
    extra ||
    received.length !== expected.length ||
    !timingSafeEqual(expected, received)
  )
    throw new HttpError(401, "Sessão inválida. Entre novamente.");
  let payload: any;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    throw new HttpError(401, "Sessão inválida.");
  }
  if (
    !uuid(payload.sub) ||
    !uuid(payload.empresa) ||
    payload.audience !== "pceg-cadastros-v1" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= now / 1000
  )
    throw new HttpError(401, "Sessão expirada. Entre novamente.");
  return payload;
}
export async function authorize(req: any, admin = false) {
  const authorization = req.headers.authorization;
  if (typeof authorization !== "string" || !authorization.startsWith("Bearer "))
    throw new HttpError(401, "Entre novamente para validar sua sessão.");
  const payload = verifySession(authorization.slice(7));
  const db = database();
  const { data: user, error } = await db
    .from("usuarios")
    .select("id,empresa_id,perfil,ativo,senha")
    .eq("id", payload.sub)
    .single();
  if (
    error ||
    !user?.ativo ||
    user.empresa_id !== payload.empresa ||
    passwordVersion(user.senha) !== payload.ver
  )
    throw new HttpError(401, "Sessão inválida. Entre novamente.");
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
  if (admin && user.perfil !== "ADMIN")
    throw new HttpError(
      403,
      "Somente o administrador pode alterar este cadastro.",
    );
  return { db, user };
}
export function fail(res: any, error: unknown) {
  res.setHeader("Cache-Control", "no-store");
  return res
    .status(error instanceof HttpError ? error.status : 500)
    .json({
      error:
        error instanceof HttpError
          ? error.message
          : "Não foi possível concluir a operação. Tente novamente.",
    });
}
export function checkDb(error: any) {
  if (!error) return;
  if (error.code === "23505")
    throw new HttpError(409, "Já existe um cadastro com esses dados.");
  if (error.code === "P0001" || error.code === "23514")
    throw new HttpError(409, error.message);
  throw new HttpError(500, "Erro ao acessar o banco de dados.");
}
