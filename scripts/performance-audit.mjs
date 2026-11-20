import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', 'gallery.html', 'about.html', 'projects/project-04.html',
  'projects/fridgekey.html', 'projects/naborfood.html', 'projects/project-03.html'];
const resolve = (page, url) => {
  if (!url || /^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(url)) return null;
  const name = decodeURIComponent(url.split(/[?#]/)[0]);
  const absolute = name.startsWith('/') ? path.join(root, name) : path.resolve(root, path.dirname(page), name);
  if (!absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return null;
  return path.relative(root, absolute);
};
const output = pages.map(page => {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  const resources = new Map();
  let images = 0, missingImageDimensions = 0;
  for (const match of html.matchAll(/<(img|image|video|audio|source|iframe|script|link)\b([^>]*)>/gi)) {
    const tag = match[1].toLowerCase();
    const attrs = Object.fromEntries([...match[2].matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(m => [m[1].toLowerCase(), m[3]]));
    if (tag === 'img' && attrs.src) {
      images++;
      if (!attrs.width || !attrs.height) missingImageDimensions++;
    }
    if (tag === 'link' && !['stylesheet', 'preload', 'modulepreload'].includes(attrs.rel)) continue;
    const url = attrs.src || attrs['data-src'] || attrs.href || attrs['xlink:href'];
    const file = resolve(page, url);
    if (!file) continue;
    const lazy = attrs.loading === 'lazy' || Boolean(attrs['data-src']) || attrs.preload === 'none' || tag === 'source';
    const previous = resources.get(file);
    resources.set(file, { file, bytes:fs.statSync(path.join(root, file)).size, lazy:previous ? previous.lazy && lazy : lazy, tag });
  }
  const list = [...resources.values()];
  const fonts = new Set();
  for (const resource of list.filter(item => item.file.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(root, resource.file), 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g)) {
      if (!/\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(match[1])) continue;
      const file = resolve(resource.file, match[1]);
      if (file) fonts.add(file);
    }
  }
  return { page, htmlBytes:Buffer.byteLength(html), images, missingImageDimensions,
    directResourceCount:list.length, directResourceBytes:list.reduce((n, item) => n + item.bytes, 0),
    eagerDirectBytes:list.filter(item => !item.lazy).reduce((n, item) => n + item.bytes, 0),
    declaredFontBytes:[...fonts].reduce((n, file) => n + fs.statSync(path.join(root, file)).size, 0),
    largest:list.sort((a, b) => b.bytes - a.bytes).slice(0, 8) };
});
const result = { note:'Static declared resources, deduplicated per page; not a network trace or a loading-time measurement.', pages:output };
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(output.map(({page, directResourceBytes, eagerDirectBytes, declaredFontBytes, missingImageDimensions}) =>
  ({page, directResourceBytes, eagerDirectBytes, declaredFontBytes, missingImageDimensions})), null, 2));
