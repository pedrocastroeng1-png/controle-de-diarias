import { test } from "node:test";
import assert from "node:assert/strict";
import { signSession, verifySession, authorize } from "../server/session";
import { serverApi } from "../src/lib/server-api";
import {
  aplicarAtestados,
  diasFinanceiros,
  valorFinanceiro,
} from "../src/lib/atestados-relatorio";
process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production-012345";
const user = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  empresa_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  senha: "test-hash",
};
test("sessão assinada rejeita adulteração, expiração e outro segredo", () => {
  const token = signSession(user, 100000);
  assert.equal(verifySession(token, 100000).sub, user.id);
  assert.throws(() => verifySession("x" + token, 100000));
  assert.throws(() => verifySession(token, 100000 + 28800001));
  const previous = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "other-test-secret-at-least-32-characters";
  assert.throws(() => verifySession(token, 100000));
  process.env.JWT_SECRET = previous;
});
test("acesso sem sessão é rejeitado antes de consultar o banco", async () => {
  await assert.rejects(
    () => authorize({ headers: {} }, true),
    /Entre novamente/,
  );
});
test("feriado em meia diária e atestado futuro zera dinheiro e dias sem alterar origem", () => {
  const employee: any = {
    id: "f",
    empresa_id: "e",
    nome: "Teste",
    tipo_colaborador: "DIARISTA",
    funcao: { valor_diaria: 80 },
    obra_id: "o",
    obra: { nome: "Obra" },
  };
  const original: any = {
    funcionario_id: "f",
    empresa_id: "e",
    data: "2099-09-14",
    status: "PRESENTE",
    tipo_colaborador: "DIARISTA",
    valor_diaria: 80,
    percentual_diaria: 50,
    tipo_diaria: "MEIA_DIARIA",
    valor_calculado: 40,
  };
  const certificate: any = {
    id: "a",
    employee_id: "f",
    empresa_id: "e",
    start_date: "2099-09-14",
    end_date: "2099-09-18",
  };
  const rows = aplicarAtestados([original], [certificate], [employee], {}, [
    "2099-09-14",
  ]);
  const holiday = rows.find((r) => r.data === "2099-09-14")!;
  assert.equal(valorFinanceiro(holiday), 0);
  assert.equal(diasFinanceiros(holiday), 0);
  assert.equal(original.valor_calculado, 40);
  assert.equal(original.status, "PRESENTE");
  assert.ok(
    rows
      .filter((r) => r.data !== "2099-09-14")
      .every((r) => diasFinanceiros(r) === 1),
  );
});
test("falta com tipo meia não conta, meia normal conta 0.5, atestado integral conta 1", () => {
  const base: any = {
    tipo_colaborador: "DIARISTA",
    tipo_diaria: "MEIA_DIARIA",
    percentual_diaria: 50,
  };
  assert.equal(diasFinanceiros({ ...base, status: "FALTOU" }), 0);
  assert.equal(diasFinanceiros({ ...base, status: "PRESENTE" }), 0.5);
  assert.equal(diasFinanceiros({ ...base, status: "ATESTADO MÉDICO" }), 1);
});
test("erro ao buscar feriados não é convertido em lista vazia", async () => {
  const oldFetch = globalThis.fetch;
  const oldStorage = globalThis.localStorage;
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => "test", removeItem: () => {} },
  });
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ error: "Sessão inválida" }), { status: 401 });
  try {
    await assert.rejects(() => serverApi("/api/feriados"), /Sessão inválida/);
  } finally {
    globalThis.fetch = oldFetch;
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: oldStorage,
    });
  }
});

test('servidor permite consulta do operador, mas bloqueia alteração administrativa',async()=>{
 const previousFetch=globalThis.fetch;const oldUrl=process.env.SUPABASE_URL;const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-only-key';
 globalThis.fetch=async(input)=>new Response(JSON.stringify(String(input).includes('/usuarios')?{...user,ativo:true,perfil:'OPERADOR'}:{ativo:true}),{status:200,headers:{'Content-Type':'application/json'}});
 try {const req={headers:{authorization:'Bearer '+signSession(user)}};assert.equal((await authorize(req)).user.perfil,'OPERADOR');await assert.rejects(()=>authorize(req,true),/Somente o administrador/);}
 finally{globalThis.fetch=previousFetch;process.env.SUPABASE_URL=oldUrl;process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
test('servidor rejeita empresa alterada e usuário desativado após emissão da sessão',async()=>{
 const previousFetch=globalThis.fetch;const oldUrl=process.env.SUPABASE_URL;const oldKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 process.env.SUPABASE_URL='https://fixture.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='fixture-only-key';
 try {for(const change of [{ativo:false},{empresa_id:'cccccccc-cccc-cccc-cccc-cccccccccccc'}]) {
  globalThis.fetch=async()=>new Response(JSON.stringify({...user,ativo:true,perfil:'ADMIN',...change}),{status:200,headers:{'Content-Type':'application/json'}});
  await assert.rejects(()=>authorize({headers:{authorization:'Bearer '+signSession(user)}},true),/Sessão inválida/);
 }}finally{globalThis.fetch=previousFetch;process.env.SUPABASE_URL=oldUrl;process.env.SUPABASE_SERVICE_ROLE_KEY=oldKey;}
});
