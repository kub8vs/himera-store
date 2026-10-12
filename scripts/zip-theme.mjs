// Packs only the Shopify theme folders into himera-theme.zip (Online Store → Themes → Add theme → Upload zip).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'himera-theme.zip');
const DIRS = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates'];
fs.rmSync(OUT, { force: true });
execFileSync('zip', ['-r', '-q', '-X', OUT, ...DIRS.filter((d) => fs.existsSync(path.join(ROOT, d))), '-x', '*.DS_Store'], { cwd: ROOT, stdio: 'inherit' });
console.log('✓', path.relative(ROOT, OUT));
