import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
async function walk(d) {
  return (
    await Promise.all(
      (await readdir(d, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? walk(join(d, e.name)) : join(d, e.name),
      ),
    )
  ).flat();
}
let total = 0;
for (const f of (await walk('dist')).filter((f) => f.endsWith('.html'))) {
  const hits = [...(await readFile(f, 'utf8')).matchAll(/\[Needs input: ([^\]]+)\]/g)].map((m) => m[1]);
  if (hits.length) {
    total += hits.length;
    console.log(f, '\n  - ' + hits.join('\n  - '));
  }
}
console.log(`${total} placeholder(s)`);
