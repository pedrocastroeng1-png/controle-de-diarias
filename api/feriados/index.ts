import {
  authorize,
  checkDb,
  fail,
  HttpError,
  uuid,
} from "../../server/session.js";
export default async function handler(req: any, res: any) {
  res.setHeader("Cache-Control", "no-store");
  if (!["GET", "POST"].includes(req.method)) return res.status(405).end();
  try {
    const { db, user } = await authorize(req, req.method === "POST");
    if (req.method === "GET") {
      const rows: any[] = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await db
          .from("feriados")
          .select("*")
          .eq("empresa_id", user.empresa_id)
          .order("data")
          .range(offset, offset + 499);
        checkDb(error);
        rows.push(...data!);
        if (data!.length < 500) break;
      }
      return res.status(200).json(rows);
    }
    const b = req.body || {};
    if (
      !["preview", "create", "delete"].includes(b.action) ||
      !["create", "delete"].includes(b.operation) ||
      typeof b.data !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(b.data) ||
      (b.id != null && !uuid(b.id))
    )
      throw new HttpError(400, "Dados de feriado inválidos.");
    if (
      b.operation === "create" &&
      (typeof b.descricao !== "string" ||
        !b.descricao.trim() ||
        b.descricao.trim().length > 500)
    )
      throw new HttpError(400, "Informe uma descrição de até 500 caracteres.");
    if (b.action !== "preview" && b.action !== b.operation)
      throw new HttpError(400, "Operação inválida.");
    const { data, error } = await db.rpc("gerenciar_feriado_seguro", {
      p_empresa: user.empresa_id,
      p_usuario: user.id,
      p_data: b.data,
      p_descricao: b.descricao?.trim() || "",
      p_id: b.id || null,
      p_operacao: b.operation,
      p_confirmar: b.action !== "preview",
      p_fingerprint: b.fingerprint || null,
    });
    checkDb(error);
    return res.status(200).json(data);
  } catch (e) {
    return fail(res, e);
  }
}
