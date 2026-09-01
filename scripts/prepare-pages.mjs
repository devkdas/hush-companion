import { readFile, writeFile } from 'node:fs/promises';

export function preparePagesHtml(html, basePath = '/hush-companion/') {
  return html
    .replace('src="/src/main.tsx"', `src="${basePath}src/main.tsx"`)
    .replaceAll('href="favicon.svg"', `href="${basePath}favicon.svg"`)
    .replaceAll('href="/favicon.svg"', `href="${basePath}favicon.svg"`);
}

if (process.argv[1]?.endsWith('prepare-pages.mjs')) {
  const file = 'dist/index.html';
  const html = await readFile(file, 'utf8');
  await writeFile(file, preparePagesHtml(html));
}
