import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

// Exercise the real API with only its transport replaced; no production writes.
test('ADMIN e OPERADOR salvam sem foto; CONSULTA e feriados continuam bloqueados', async () => {
  const result = await build({
    entryPoints: ['src/lib/api.ts'], bundle: true, write: false, platform: 'node', format: 'esm',
    plugins: [{ name: 'attendance-transport', setup(b) {
      b.onResolve({ filter: /^\.\/supabase$/ }, () => ({ path: 'transport', namespace: 'test' }));
      b.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: `
        export const supabase = { from(table) {
          if (table !== 'presencas') throw new Error('Unexpected table');
          return { upsert(rows, options) {
            if (options.onConflict !== 'funcionario_id,data') throw new Error('Conflict key changed');
            return { select: async () => ({data: rows, error: null}) };
          }};
        }};` }));
    }}],
  });
  const { api } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let perfil = 'OPERADOR';
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => JSON.stringify({ id: 'test', perfil, empresa_id: 'empresa' }) } });
  try {
    api.getFeriados = async () => [];
    const payload = [
      { funcionario_id: 'integral', obra_id: 'obra', data: '2026-09-18', presente: true },
      { funcionario_id: 'meia', obra_id: 'obra', data: '2026-09-18', presente: true, tipo_diaria: 'MEIA_DIARIA', percentual_diaria: 50 },
      { funcionario_id: 'falta', obra_id: 'obra', data: '2026-09-18', presente: false },
    ];
    for (perfil of ['OPERADOR', 'ADMIN']) {
      assert.deepEqual(await api.salvarPresencas(payload), payload.map(p => ({ ...p, empresa_id: 'empresa' })));
    }
    perfil = 'CONSULTA';
    await assert.rejects(api.salvarPresencas(payload), /CONSULTA/);
    perfil = 'OPERADOR';
    api.getFeriados = async () => [{ data: '2026-09-18' }];
    await assert.rejects(api.salvarPresencas(payload), /Feriado/);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});

test('telas de presença e PDF não referenciam câmera nem Storage de presença', () => {
  for (const file of ['src/pages/operador/Presenca.tsx', 'src/pages/operador/Painel.tsx', 'src/pages/admin/Relatorios.tsx', 'src/pages/admin/QuadroAtual.tsx']) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /attendance-photos|photo_taken_|uploadAttendancePhoto|cameraModal|capture=|getUserMedia/);
  }
  const source = readFileSync('src/pages/operador/Presenca.tsx', 'utf8');
  assert.match(source, /employee-photos/);
  assert.match(source, /handleToggleMeiaDiaria/);
  assert.match(source, /atestadosAtivos/);
  const layout = readFileSync('src/components/layout/Layout.tsx', 'utf8');
  assert.match(layout, /\/admin\/auditoria/);
  assert.match(layout, /consultaMenuGroups/);
  assert.match(layout, /Quadro Atual/);
});
