import fs from 'node:fs';
import path from 'node:path';
import { checkSite, siteFiles, siteRoot } from './check-site.mjs';

checkSite();
const output = path.join(siteRoot, 'dist');
const marker = path.join(output, '.portfolio-generated');
if (fs.existsSync(output) && !fs.existsSync(marker)) {
  throw new Error('Refusing to replace an existing dist directory that was not created by this build.');
}
if (fs.existsSync(output)) fs.rmSync(output, { recursive:true });
fs.mkdirSync(output);
fs.writeFileSync(marker, 'Generated from portfolio-site; do not edit this directory.\n');
for (const file of siteFiles()) {
  const target = path.join(output, file);
  fs.mkdirSync(path.dirname(target), { recursive:true });
  fs.copyFileSync(path.join(siteRoot, file), target);
}
console.log('Static deployment ready in dist/. Existing HTML, CSS, JavaScript and assets were copied without transformation.');
