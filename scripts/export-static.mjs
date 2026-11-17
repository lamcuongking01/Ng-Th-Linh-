import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const staticDir = path.join(rootDir, 'github-static');
const artifactDir = path.join(
  rootDir,
  '.aistudio/artifacts/brain/5c9b7907-bb9a-47e4-9ede-59d0b1dc0f36'
);

fs.mkdirSync(staticDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

const distHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');
const cssMatch = distHtml.match(/<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
const jsMatch = distHtml.match(/<script type="module"[^>]*src="([^"]+)"[^>]*><\/script>/);

if (!cssMatch || !jsMatch) {
  throw new Error('Could not locate built CSS or JS asset inside dist/index.html');
}

const cssRel = cssMatch[1].replace(/^\.\//, '');
const jsRel = jsMatch[1].replace(/^\.\//, '');

// 1. Copy compiled CSS to style.css
const cssContent = fs.readFileSync(path.join(distDir, cssRel), 'utf8');
fs.writeFileSync(path.join(staticDir, 'style.css'), cssContent, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'style.css'), cssContent, 'utf8');

// 2. Embed local images inside JS and convert ESM bundle to classic IIFE script.js
let jsContent = fs.readFileSync(path.join(distDir, jsRel), 'utf8');
const localImages = [
  './src/assets/images/bouquet_pink_roses_1794898040217.jpg',
  './src/assets/images/memory_sunlit_roses_1794898064728.jpg',
  './src/assets/images/memory_silk_petals_1794898065190.jpg',
];

for (const imgRel of localImages) {
  const imgPath = path.join(distDir, imgRel.replace(/^\.\//, ''));
  const b64 = fs.readFileSync(imgPath).toString('base64');
  jsContent = jsContent.split(imgRel).join(`data:image/jpeg;base64,${b64}`);
}

const tempEntry = path.join(staticDir, '_bundle_entry.mjs');
fs.writeFileSync(tempEntry, jsContent, 'utf8');

try {
  await build({
    entryPoints: [tempEntry],
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    define: {
      'import.meta.url': 'window.location.href',
    },
    outfile: path.join(staticDir, 'script.js'),
  });
} finally {
  fs.rmSync(tempEntry, { force: true });
}

fs.copyFileSync(path.join(staticDir, 'script.js'), path.join(artifactDir, 'script.js'));

// 3. Emit clean index.html referencing ./style.css and ./script.js (works on GitHub Pages and file://)
const cleanHtml = distHtml
  .replace(cssMatch[0], '<link rel="stylesheet" href="./style.css" />')
  .replace(jsMatch[0], '<script defer src="./script.js"></script>');

fs.writeFileSync(path.join(staticDir, 'index.html'), cleanHtml, 'utf8');
fs.writeFileSync(path.join(artifactDir, 'index.html'), cleanHtml, 'utf8');

const guideText = `CACH UPLOAD LEN GITHUB PAGES HOAC MO TRUC TIEP:
1. Upload cac file sau vao cung mot thu muc tren GitHub:
   - index.html
   - style.css
   - script.js
   - bai1.mp3 (nhac bai 1 cua ban)
   - bai2.mp3 (nhac bai 2 cua ban)
2. Bat GitHub Pages (Settings -> Pages -> Branch: main) la chay ngay du ca hinh anh, hieu ung 3D, phao hoa va am thanh!
`;
fs.writeFileSync(path.join(staticDir, 'README_UPLOAD.txt'), guideText, 'utf8');

console.log('Exported classic static files to github-static/:');
for (const name of ['index.html', 'style.css', 'script.js']) {
  console.log(` - ${name}: ${fs.statSync(path.join(staticDir, name)).size} bytes`);
}
