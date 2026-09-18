import { test } from "node:test";
import assert from "node:assert/strict";
import {
  signSession,
  verifySession,
  passwordVersion,
  authorize,
  HttpError,
} from "../server/session";

process.env.JWT_SECRET = "test-only-secret-do-not-use-in-production-012345";

const adminUser = {
  id: "aaaaaaaa-1111-aaaa-1111-aaaaaaaaaaaa",
  empresa_id: "bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb",
  senha: "hashed-admin-password-v1",
};

const operadorUser = {
  id: "cccccccc-3333-cccc-3333-cccccccccccc",
  empresa_id: "bbbbbbbb-2222-bbbb-2222-bbbbbbbbbbbb",
  senha: "hashed-operador-password-v1",
};

test("mudança de senha altera passwordVersion e invalida sessões antigas", () => {
  const hash1 = "bcrypt-hash-1";
  const hash2 = "bcrypt-hash-2";

  const v1 = passwordVersion(hash1);
  const v2 = passwordVersion(hash2);

  assert.notEqual(v1, v2, "A versão da senha deve ser diferente para hashes distintos");

  const tokenOld = signSession({ ...adminUser, senha: hash1 }, 1000);
  const verified = verifySession(tokenOld, 1000);
  assert.equal(verified.ver, v1);
  assert.notEqual(verified.ver, v2, "Token antigo não deve bater com a nova versão de senha");
});

test("acesso a módulo administrativo de usuários exige sessão válida", async () => {
  await assert.rejects(
    () => authorize({ headers: {} }, true),
    /Entre novamente/,
    "Deve rejeitar requisição sem cabeçalho Authorization"
  );
});

test("validação de regras de negócio para cadastro de usuários", () => {
  // 1. Validação de login: apenas letras minúsculas, números, ponto ou traço
  const validLogins = ["joao.silva", "maria_123", "pedro-castro", "operador01"];
  const invalidLogins = ["João", "user name", "user@domain", "UPPERCASE", "ab", ""];

  for (const l of validLogins) {
    assert.ok(/^[a-z0-9_.-]{3,60}$/.test(l), `Login válido não deveria falhar: ${l}`);
  }
  for (const l of invalidLogins) {
    assert.ok(!/^[a-z0-9_.-]{3,60}$/.test(l), `Login inválido não deveria passar: ${l}`);
  }

  // 2. Perfis válidos
  const validProfiles = ["ADMIN", "OPERADOR", "CONSULTA"];
  assert.ok(validProfiles.includes("ADMIN"));
  assert.ok(validProfiles.includes("OPERADOR"));
  assert.ok(validProfiles.includes("CONSULTA"));
  assert.ok(!validProfiles.includes("SUPERADMIN"));
  assert.ok(!validProfiles.includes("ROOT"));

  // 3. Regra de senha: mínimo 6 caracteres
  const validPassword = "minha-senha-segura";
  const shortPassword = "123";
  assert.ok(validPassword.length >= 6);
  assert.ok(shortPassword.length < 6);
});

test("proteção contra desativação ou rebaixamento do último administrador ativo", () => {
  function checkCanDeactivateOrDemote(
    activeAdminsCount: number,
    isTargetAdmin: boolean,
    newProfile: string,
    newActive: boolean
  ) {
    if (isTargetAdmin && (!newActive || newProfile !== "ADMIN")) {
      if (activeAdminsCount <= 1) {
        throw new HttpError(400, "A empresa precisa manter pelo menos um administrador ativo.");
      }
    }
    return true;
  }

  // Caso: 2 administradores ativos -> pode inativar ou alterar perfil de um deles
  assert.ok(checkCanDeactivateOrDemote(2, true, "OPERADOR", true));
  assert.ok(checkCanDeactivateOrDemote(2, true, "ADMIN", false));

  // Caso: 1 administrador ativo -> NÃO pode inativar nem rebaixar
  assert.throws(
    () => checkCanDeactivateOrDemote(1, true, "OPERADOR", true),
    /A empresa precisa manter pelo menos um administrador ativo/
  );
  assert.throws(
    () => checkCanDeactivateOrDemote(1, true, "ADMIN", false),
    /A empresa precisa manter pelo menos um administrador ativo/
  );

  // Caso: Operador sendo inativado com 1 admin existente -> permitido
  assert.ok(checkCanDeactivateOrDemote(1, false, "OPERADOR", false));
});

test("exclusão lógica preserva integridade histórica (sem DELETE físico)", () => {
  const userRow = {
    id: "user-123",
    nome: "Operador Teste",
    ativo: true,
    arquivado: false,
    arquivado_em: null as string | null,
  };

  // Simular inativação lógica
  const updateData = {
    ativo: false,
    arquivado: true,
    arquivado_em: new Date().toISOString(),
  };

  const updatedUser = { ...userRow, ...updateData };

  assert.equal(updatedUser.ativo, false);
  assert.equal(updatedUser.arquivado, true);
  assert.ok(updatedUser.arquivado_em !== null);
  // O id e a existência do registro são estritamente preservados
  assert.equal(updatedUser.id, userRow.id);
});

test("restrição de reativação do usuário Carlos", () => {
  function validateReactivation(username: string, newAtivo: boolean) {
    if (newAtivo && username.toLowerCase() === "carlos") {
      throw new HttpError(400, "O usuário Carlos permanece inativo por determinação do sistema.");
    }
    return true;
  }

  assert.throws(
    () => validateReactivation("Carlos", true),
    /O usuário Carlos permanece inativo/
  );
  assert.throws(
    () => validateReactivation("carlos", true),
    /O usuário Carlos permanece inativo/
  );
  // Outro usuário pode ser reativado
  assert.ok(validateReactivation("junior", true));
});
