#!/usr/bin/env node
/**
 * Renders src/vehicles/manufacturers.json from a Yad2 catalog dump.
 *
 * Input: JSON file holding either the browser dump `{ data: [...] }` or a bare array of
 *   { id: number, title: string, engTitle: string, models: [{ id: number, title: string }] }
 * Output: the repo file, written in its packed house style (models grouped a few per line).
 *
 * Prettier ignores *.json in this repo, so this layout is preserved as-is.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TARGET = 'src/vehicles/manufacturers.json';
const LINE_BUDGET = 108;

if (process.argv.includes('--help') || process.argv.length < 3) {
  console.error(
    [
      'Usage: node render-manufacturers.mjs <catalog-dump.json> [out.json]',
      '',
      'Expected input shape (either form):',
      '  { "data": [ { "id": 1, "title": "אאודי", "engTitle": "Audi",',
      '               "models": [ { "id": 10003, "title": "A1" } ] } ] }',
      '  [ ...same objects... ]',
      '',
      `Writes ${TARGET} unless a second path is given.`,
    ].join('\n'),
  );
  process.exit(process.argv.includes('--help') ? 0 : 1);
}

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const rows = Array.isArray(raw) ? raw : raw.data;
if (!Array.isArray(rows)) {
  console.error('Could not find an array of manufacturers — expected an array or { data: [...] }.');
  process.exit(1);
}

const entries = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
const lines = [];

entries.forEach((m, index) => {
  const last = index === entries.length - 1;
  const name = String(m.title ?? m.name ?? '').trim();
  const nameEn = String(m.engTitle ?? m.nameEn ?? '').trim();
  const head = `  { "id": "${m.id}", "name": "${name}", "nameEn": "${nameEn}", "models": [`;
  const models = (m.models ?? []).map(
    (x) => `{ "id": ${x.id}, "name": "${String(x.title ?? x.name ?? '').trim()}" }`,
  );

  if (models.length === 0) {
    lines.push(head + (last ? ' ] }' : ' ] },'));
    return;
  }

  lines.push(head);
  let current = '   ';
  const flush = () => {
    if (current.trim() !== '') lines.push(current.replace(/\s+$/, ''));
    current = '   ';
  };
  models.forEach((model, i) => {
    const piece = ' ' + model + (i === models.length - 1 ? '' : ',');
    if ((current + piece).length > LINE_BUDGET) flush();
    current += piece;
  });
  flush();
  lines.push('  ]' + (last ? ' }' : ' },'));
});

const out = process.argv[3] ?? TARGET;
writeFileSync(out, '[\n' + lines.join('\n') + '\n]\n');

const modelCount = entries.reduce((a, m) => a + (m.models?.length ?? 0), 0);
console.log(`Wrote ${out}: ${entries.length} manufacturers, ${modelCount} models.`);
