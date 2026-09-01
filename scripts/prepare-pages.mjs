import { readFile, writeFile } from 'node:fs/promises';

const file = 'dist/index.html';
let html = await readFile(file, 'utf8');
html = html
  .replace('src="/src/main.tsx"', 'src="/hush-companion/src/main.tsx"')
  .replaceAll('href="/favicon.svg"', 'href="/hush-companion/favicon.svg"');
await writeFile(file, html);
