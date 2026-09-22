import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWhatsAppPhone, whatsAppLink } from '../src/lib/whatsapp-phone';
import { buildWelcomeMessage } from '../src/lib/welcome-message';

test('WhatsApp aceita número brasileiro com DDD e evita duplicar o país', () => {
  for (const phone of ['(82) 99999-9999', '82999999999', '+55 (82) 99999-9999', '5582999999999']) {
    assert.equal(normalizeWhatsAppPhone(phone), '5582999999999');
  }
  assert.equal(normalizeWhatsAppPhone('(55) 99999-9999'), '5555999999999');
  assert.equal(normalizeWhatsAppPhone('82 3333-3333'), '558233333333');
  assert.equal(normalizeWhatsAppPhone(null), null);
  assert.equal(normalizeWhatsAppPhone('  '), null);
  for (const value of ['99999-9999', 'telefone82', '++', '5500999999999', '123', 82999999999]) {
    assert.throws(() => normalizeWhatsAppPhone(value));
  }
  assert.throws(() => whatsAppLink('', 'teste'));
});

const user = { nome: 'João & José', usuario: 'joao.silva', perfil: 'OPERADOR' as const };
test('guia usa login real, instala Android/iPhone e limita dados compartilhados', () => {
  const message = buildWelcomeMessage({ ...user, senha: 'NEVER_SHARE_SECRET' } as typeof user, 'https://example.com/admin?token=NEVER_SHARE_TOKEN');
  assert.match(message, /Bem-vindo ao PCEG/);
  assert.match(message, /João & José/);
  assert.match(message, /Login:\* joao.silva/);
  for (const label of ['ANDROID', 'IPHONE', 'DIÁRIAS', 'MATERIAIS', 'FERRAMENTAS', 'Meia Diária', 'Emprestar', 'Devolver']) assert.ok(message.includes(label));
  assert.ok(!message.includes('NEVER_SHARE'));
  assert.ok(!message.includes('E-mail cadastrado'));
  const url = new URL(whatsAppLink('(82) 99999-9999', message));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, '/5582999999999');
  assert.equal(url.searchParams.get('text'), message);
});

test('consulta e permissões personalizadas não recebem instruções de operações indisponíveis', () => {
  const consulta = buildWelcomeMessage({ ...user, perfil: 'CONSULTA' }, 'https://example.com');
  assert.ok(!consulta.includes('*REGISTRAR DIÁRIAS*'));
  assert.ok(!consulta.includes('*REGISTRAR MATERIAIS*'));
  assert.ok(!consulta.includes('*FERRAMENTAS*'));
  assert.match(consulta, /perfil é de consulta/);
  const custom = buildWelcomeMessage({ ...user, modo_permissoes: 'PERSONALIZADO', permissoes: ['FERRAMENTAS_OPERAR'] }, 'https://example.com');
  assert.ok(custom.includes('*FERRAMENTAS*'));
  assert.ok(!custom.includes('*REGISTRAR DIÁRIAS*'));
  assert.ok(!custom.includes('*REGISTRAR MATERIAIS*'));
});

test('campos de cadastro não injetam novas linhas na mensagem', () => {
  const message = buildWelcomeMessage({ ...user, nome: 'João\n*Admin*' }, 'https://example.com');
  assert.ok(message.startsWith('Olá, *João  Admin*!'));
  assert.throws(() => buildWelcomeMessage(user, 'javascript:alert(1)'));
});
