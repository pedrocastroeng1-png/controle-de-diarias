import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const root = new URL('../', import.meta.url).pathname;
const schema = JSON.parse(readFileSync(join(root, 'supabase/reference/schema-2026-09-11.json'), 'utf8'));
const relations = new Set(schema.columns.map((c: {table_name: string}) => c.table_name));
const rpcs = new Set(schema.functions.map((f: {name: string}) => f.name));
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(join(dir, entry.name)) : /\.tsx?$/.test(entry.name) ? [join(dir, entry.name)] : []);
}

test('tabelas/views e RPCs literais usadas pelo cliente existem no catálogo real', () => {
  const errors: string[] = [];
  let checked = 0;
  for (const file of files(join(root, 'src'))) {
    const source = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        const { expression, name } = node.expression;
        const arg = node.arguments[0];
        if (expression.getText(source) === 'supabase' && arg && ts.isStringLiteralLike(arg) && ['from', 'rpc'].includes(name.text)) {
          checked++;
          if (!(name.text === 'rpc' ? rpcs : relations).has(arg.text)) errors.push(`${file}: ${name.text}(${arg.text})`);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.ok(checked > 50, 'A verificação precisa cobrir as consultas reais do projeto.');
  assert.deepEqual(errors, []);
});

test('tipo gerado preserva todas as colunas de funcionário e status reais', () => {
  const source = readFileSync(join(root, 'src/types/database.generated.ts'), 'utf8');
  const row = source.split('funcionarios: {')[1].split('Insert: {')[0];
  for (const column of schema.columns.filter((c: {table_name: string}) => c.table_name === 'funcionarios')) {
    assert.ok(row.includes(`${column.column_name}:`), column.column_name);
  }
  assert.ok(source.includes('days_of_week: number[]'));
  assert.ok(source.includes('push_dispatch_status: string'));
});
