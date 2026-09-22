import { test } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/usuarios/index';
import { signSession } from '../server/session';

test('API persiste, preserva e limpa telefone sem expor senha e bloqueia operador', async t => {
  process.env.JWT_SECRET = 'only-for-isolated-tests-not-production-secret-12345';
  process.env.SUPABASE_URL = 'https://database.example.test';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-only-key';
  const admin = { id: 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', empresa_id: 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', perfil: 'ADMIN', ativo: true, senha: 'test-hash' };
  const target = { id: 'cccccccc-3333-4333-8333-cccccccccccc', nome: 'Operador Teste', login: 'teste', usuario: 'teste', perfil: 'OPERADOR', ativo: true, telefone: '5582999999999' };
  let writes: any[] = [];
  let role = 'ADMIN';
  t.mock.method(globalThis, 'fetch', async (input: any, init: any = {}) => {
    const url = new URL(String(input));
    const method = init.method || 'GET';
    let response: any = null;
    if (url.pathname.endsWith('/empresas')) response = { ativo: true };
    else if (url.pathname.endsWith('/usuarios')) {
      if (method === 'POST' || method === 'PATCH') {
        const body = JSON.parse(init.body);
        const payload = Array.isArray(body) ? body[0] : body;
        writes.push(payload);
        response = { ...target, ...payload };
        delete response.senha; // PostgREST returns only the explicit safe SELECT projection.
        assert.ok(!url.searchParams.get('select')?.split(',').includes('senha'));
      } else if (url.searchParams.get('id') === `eq.${admin.id}`) response = { ...admin, perfil: role };
      else if (url.searchParams.get('id') === `eq.${target.id}`) response = target;
      else response = null;
    }
    return new Response(JSON.stringify(response), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  async function call(body: any) {
    let status = 0; let data: any;
    const res = { setHeader() {}, status(code: number) { status = code; return res; }, json(value: any) { data = value; return res; } };
    await handler({ method: 'POST', headers: { authorization: `Bearer ${signSession(admin)}` }, body }, res);
    return { status, data };
  }
  const created = await call({ action: 'create', nome: 'Operador Teste', login: 'teste', perfil: 'OPERADOR', senha: 'only-test-password', telefone: '(82) 99999-9999' });
  assert.equal(created.status, 201);
  assert.equal(writes.at(-1).telefone, '5582999999999');
  assert.equal(created.data.telefone, '5582999999999');
  assert.ok(!('senha' in created.data));
  assert.equal((await call({ action: 'update', id: target.id, telefone: '(82) 98888-8888' })).status, 200);
  assert.equal(writes.at(-1).telefone, '5582988888888');
  assert.equal((await call({ action: 'update', id: target.id })).status, 200);
  assert.ok(!('telefone' in writes.at(-1)));
  assert.equal((await call({ action: 'update', id: target.id, telefone: null })).status, 200);
  assert.equal(writes.at(-1).telefone, null);
  writes = [];
  assert.equal((await call({ action: 'update', id: target.id, telefone: 'invalid' })).status, 400);
  assert.equal(writes.length, 0);
  role = 'OPERADOR';
  assert.equal((await call({ action: 'update', id: target.id, telefone: null })).status, 403);
  assert.equal(writes.length, 0);
});
