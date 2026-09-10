#!/usr/bin/env node
/**
 * Renders src/realestate/property-types.json with its hand-aligned columns.
 *
 * The existing file lines up "yad2Id", "name" and "nameEn" at fixed character offsets so the
 * table is readable in a diff. Prettier ignores *.json here, so nothing reflows it for you.
 *
 * Input: JSON array of { id, yad2Id, name, nameEn } — already in the order you want on disk.
 *   `yad2Id` may be a comma-joined list ("5,39,55") for an aggregate entry.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const TARGET = 'src/realestate/property-types.json';
const COL_YAD2 = 31;
const COL_NAME = 53;
const COL_NAME_EN = 87;

if (process.argv.includes('--help') || process.argv.length < 3) {
  console.error(
    [
      'Usage: node render-property-types.mjs <rows.json> [out.json]',
      '',
      'Expected input shape:',
      '  [ { "id": "apartment", "yad2Id": "1", "name": "דירה", "nameEn": "Apartment" } ]',
      '',
      'Keep semantic `id` values stable — they are the public MCP enum in src/mcp/tools.ts.',
      `Writes ${TARGET} unless a second path is given.`,
    ].join('\n'),
  );
  process.exit(process.argv.includes('--help') ? 0 : 1);
}

const rows = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('Expected a non-empty array of { id, yad2Id, name, nameEn }.');
  process.exit(1);
}

const missing = rows.filter((r) => !r.id || !r.yad2Id || !r.name || !r.nameEn);
if (missing.length > 0) {
  console.error('These rows are missing fields:', JSON.stringify(missing, null, 2));
  process.exit(1);
}

const pad = (text, column) => text + ' '.repeat(Math.max(1, column - text.length));

const lines = rows.map((row, index) => {
  let line = pad(`  { "id": "${row.id}",`, COL_YAD2);
  line = pad(line + `"yad2Id": "${row.yad2Id}",`, COL_NAME);
  line = pad(line + `"name": "${row.name}",`, COL_NAME_EN);
  return line + `"nameEn": "${row.nameEn}" }` + (index === rows.length - 1 ? '' : ',');
});

const out = process.argv[3] ?? TARGET;
writeFileSync(out, '[\n' + lines.join('\n') + '\n]\n');
console.log(`Wrote ${out}: ${rows.length} property types.`);
