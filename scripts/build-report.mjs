// Bundle size report for CI summaries. Usage: node scripts/build-report.mjs dist [base-dist]
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function files(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(path).isDirectory()) out.push(...files(path, rel));
    else out.push({ rel, bytes: statSync(path).size });
  }
  return out;
}

const kb = n => (n / 1024).toFixed(1) + ' kB';
const dist = process.argv[2] ?? 'dist';
const base = process.argv[3];

const rows = files(dist).sort((a, b) => b.bytes - a.bytes);
const total = rows.reduce((a, r) => a + r.bytes, 0);
console.log(`| File | Size |`);
console.log(`|---|---:|`);
for (const r of rows.slice(0, 12)) console.log(`| ${r.rel} | ${kb(r.bytes)} |`);
console.log(`| **Total** | **${kb(total)}** |`);

if (base) {
  try {
    const baseTotal = files(base).reduce((a, r) => a + r.bytes, 0);
    const diff = total - baseTotal;
    console.log(`\nChange vs base: ${diff >= 0 ? '+' : ''}${kb(diff)}`);
  } catch { console.log('\n(base build unavailable)'); }
}
