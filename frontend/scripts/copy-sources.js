// На Windows dev `_sdk`/`_templates` — junction'ы (mklink /J).
// В CI/Render таких junction'ов нет, vite не найдёт алиасы.
// Этот скрипт перед билдом превращает их в реальные копии.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(frontendDir, '..');

for (const name of ['sdk', 'templates']) {
  const src = path.join(repoRoot, name);
  const dst = path.join(frontendDir, '_' + name);
  if (!fs.existsSync(src)) {
    console.error(`copy-sources: source not found: ${src}`);
    process.exit(1);
  }
  const stat = fs.lstatSync(dst, { throwIfNoEntry: false });
  if (stat && stat.isSymbolicLink()) {
    // junction на Windows — оставляем
    console.log(`copy-sources: keep junction _${name}`);
    continue;
  }
  if (stat) fs.rmSync(dst, { recursive: true, force: true });
  fs.cpSync(src, dst, { recursive: true });
  console.log(`copy-sources: copied ${name} → _${name}`);
}
