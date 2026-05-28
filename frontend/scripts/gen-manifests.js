// Генерация per-template PWA-манифестов в public/apps/<id>.webmanifest.
// Запускается перед vite build (после copy-sources).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(__dirname, '..');
const metaUrl = pathToFileURL(path.join(frontendDir, 'src', 'templates.meta.js')).href;

const { TEMPLATES_META } = await import(metaUrl);

const outDir = path.join(frontendDir, 'public', 'apps');
fs.mkdirSync(outDir, { recursive: true });

for (const t of TEMPLATES_META) {
  const manifest = {
    id: `/?app=${t.id}`,
    name: t.name,
    short_name: t.short || t.name,
    description: t.tagline,
    start_url: `/?app=${t.id}`,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: t.backgroundColor || '#0a0a14',
    theme_color: t.themeColor || '#0a0a14',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
  const file = path.join(outDir, `${t.id}.webmanifest`);
  fs.writeFileSync(file, JSON.stringify(manifest, null, 2));
  console.log(`gen-manifests: ${t.id} → ${path.relative(frontendDir, file)}`);
}
