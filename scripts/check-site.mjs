import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'gallery.html', 'about.html', 'projects/naborfood.html',
  'projects/fridgekey.html', 'projects/project-03.html', 'projects/project-04.html'];
const textTypes = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt', '.md']);
const privateName = name => name.startsWith('.') || /(?:credentials|\.pem$|\.key$|\.p12$|\.pfx$|\.zip$|\.bak$|\.log$)/i.test(name);

// Deployment contains the existing runtime files, without repository tools or notes.
export function siteFiles(root = siteRoot) {
  const result = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes:true })) {
      const relative = path.join(directory, entry.name);
      if (entry.name === '.DS_Store') continue;
      if (entry.isSymbolicLink()) throw new Error(`Symlinks are not deployable: ${relative}`);
      if (privateName(entry.name)) throw new Error(`Private or backup file in the public site: ${relative}`);
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile()) result.push(relative);
    }
  }
  for (const entry of fs.readdirSync(root, { withFileTypes:true })) {
    if (entry.name === 'assets' || entry.name === 'projects') {
      if (!entry.isDirectory() || entry.isSymbolicLink()) throw new Error(`Expected a real directory: ${entry.name}`);
      walk(entry.name);
    } else if (/\.(html|css|js)$/.test(entry.name)) {
      if (privateName(entry.name)) throw new Error(`Private file in the public site: ${entry.name}`);
      if (!entry.isFile() || entry.isSymbolicLink()) throw new Error(`Expected a real file: ${entry.name}`);
      result.push(entry.name);
    }
  }
  return result.sort();
}

export function checkSite(root = siteRoot, { quiet = false } = {}) {
  const files = siteFiles(root);
  const publicFiles = new Set(files.map(file => file.split(path.sep).join('/')));
  const errors = [];
  let references = 0;
  let javascript = 0;
  let bytes = 0;
  const fail = (file, message) => errors.push(`${file}: ${message}`);
  for (const file of pages) if (!publicFiles.has(file)) fail(file, 'required page is missing');

  function checkReference(file, raw) {
    const ref = raw.trim().replace(/&amp;/g, '&');
    if (!ref || ref.startsWith('#') || ref.includes('${') || ref.includes('{{')) return;
    if (/^(?:file:|https?:\/\/(?:localhost|127\.0\.0\.1)(?=[:/]|$))/i.test(ref)) {
      fail(file, 'a resource points to a local machine'); return;
    }
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(ref)) return;
    let decoded;
    try { decoded = decodeURIComponent(ref.split(/[?#]/, 1)[0]); }
    catch { fail(file, `invalid URL encoding: ${ref}`); return; }
    if (!decoded) return;
    const resolved = decoded.startsWith('/')
      ? path.resolve(root, `.${decoded}`)
      : path.resolve(root, path.dirname(file), decoded);
    let relative = path.relative(root, resolved).split(path.sep).join('/');
    if (relative.startsWith('../') || path.isAbsolute(relative)) {
      fail(file, `resource leaves the site directory: ${ref}`); return;
    }
    if (!relative || decoded.endsWith('/')) relative += `${relative ? '/' : ''}index.html`;
    references++;
    // Comparing exact names also catches macOS paths that would fail on Linux.
    if (!publicFiles.has(relative)) fail(file, `missing resource or filename case mismatch: ${ref}`);
  }

  for (const file of files) {
    const absolute = path.join(root, file);
    const size = fs.statSync(absolute).size;
    bytes += size;
    if (size >= 100 * 1024 * 1024) fail(file, 'file is too large for regular GitHub Git storage (100 MiB)');
    const type = path.extname(file).toLowerCase();
    if (!textTypes.has(type)) continue;
    const source = fs.readFileSync(absolute, 'utf8');
    if (/(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(source)) {
      fail(file, 'possible credential or private key; do not commit it');
    }
    if (/(?:file:\/\/|\/Users\/[^/]+\/|[A-Z]:\\Users\\)/.test(source)) fail(file, 'contains a machine-specific filesystem path');
    if (type === '.json') {
      try { JSON.parse(source); } catch { fail(file, 'invalid JSON'); }
    }
    if (type === '.html' || type === '.svg') {
      const markup = source.replace(/<!--[\s\S]*?-->/g, '');
      for (const match of markup.matchAll(/\b(?:src|href|poster|xlink:href)\s*=\s*(["'])(.*?)\1/gs)) checkReference(file, match[2]);
      for (const match of markup.matchAll(/\bsrcset\s*=\s*(["'])(.*?)\1/gs)) {
        if (match[2].startsWith('data:')) continue;
        for (const candidate of match[2].split(',')) checkReference(file, candidate.trim().split(/\s+/)[0]);
      }
      if (type === '.html') {
        for (const match of markup.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
          if (!match[2].trim() || /\bsrc\s*=/.test(match[1])) continue;
          try {
            if (/\btype\s*=\s*["']application\/json["']/.test(match[1])) JSON.parse(match[2]);
            else if (!/\btype\s*=/.test(match[1])) new vm.Script(match[2], { filename:file });
          } catch (error) { fail(file, `invalid inline script: ${error.message}`); }
        }
      }
    }
    if (type === '.css' || type === '.html' || type === '.svg') {
      for (const match of source.matchAll(/url\(\s*(?:(["'])(.*?)\1|([^\s)]+))\s*\)/gs)) checkReference(file, match[2] ?? match[3]);
    }
    if (type === '.js') {
      try { new vm.Script(source, { filename:file }); javascript++; }
      catch (error) { fail(file, `JavaScript syntax: ${error.message}`); }
      for (const match of source.matchAll(/(["'`])((?:(?:\.\.?\/)+|assets\/|projects\/)[^\s"'`]*?\.(?:png|svg|webp|jpe?g|mp[34]|ttf|woff2?|json|html|css|js)(?:\?[^"'`\s]*)?)\1/g)) checkReference(file, match[2]);
    }
  }
  if (errors.length) throw new Error(`Site validation failed (${errors.length}):\n${errors.map(error => `- ${error}`).join('\n')}`);
  const result = { files:files.length, references, javascript, bytes };
  if (!quiet) console.log(`Site check passed: ${result.files} files, ${references} local references, ${javascript} JavaScript files; ${(bytes / 1024 / 1024).toFixed(1)} MiB.`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { checkSite(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
