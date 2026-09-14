import { readFile } from 'node:fs/promises';

/** Pure validation — throws if the built HTML is missing required paths or retains forbidden source paths. */
export function verifyPagesHtml(html, basePath = '/hush-companion') {
  const required = [`${basePath}/assets/`, `${basePath}/favicon.svg`];
  const forbidden = ['src="/src/main.tsx"', 'href="favicon.svg"', 'href="/favicon.svg"'];
  for (const value of required) {
    if (!html.includes(value)) throw new Error(`Missing generated path: ${value}`);
  }
  for (const value of forbidden) {
    if (html.includes(value)) throw new Error(`Forbidden source path: ${value}`);
  }
}

// Only run when invoked directly from the CLI (not imported by tests).
if (process.argv[1]?.endsWith('verify-pages.mjs')) {
  const html = await readFile('dist/index.html', 'utf8');
  verifyPagesHtml(html);
}
