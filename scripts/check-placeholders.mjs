// Lists everything still using a placeholder. Exits 1 if any remain, so it can guard a release.
import { readFile, readdir } from 'node:fs/promises';

const dir = new URL('../src/config/', import.meta.url);
const markers = [/placehold\.co/, /\bph\(/, /example\.com/, /:\s*''\s*,/, /"easProjectId":\s*""/];
let total = 0;

for (const file of await readdir(dir)) {
  const lines = (await readFile(new URL(file, dir), 'utf8')).split('\n');
  const hits = lines
    .map((text, i) => ({ text: text.trim(), line: i + 1 }))
    .filter(({ text }) => !/^(\*|\/|const ph)/.test(text))
    .filter(({ text }) => markers.some((m) => m.test(text)));
  if (hits.length) {
    console.log(`\n${file}`);
    for (const h of hits) console.log(`  ${String(h.line).padStart(3)}  ${h.text.slice(0, 90)}`);
    total += hits.length;
  }
}
console.log(total ? `\n${total} placeholder(s) left to replace.` : 'No placeholders left.');
process.exit(total ? 1 : 0);
