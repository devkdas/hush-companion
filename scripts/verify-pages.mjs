import { readFile } from 'node:fs/promises';

const html = await readFile('dist/index.html', 'utf8');
const required = ['/hush-companion/assets/', '/hush-companion/favicon.svg'];
const forbidden = ['src="/src/main.tsx"', 'href="favicon.svg"', 'href="/favicon.svg"'];

for (const value of required) {
  if (!html.includes(value)) {
    throw new Error(`Missing generated path: ${value}`);
  }
}

for (const value of forbidden) {
  if (html.includes(value)) {
    throw new Error(`Forbidden source path: ${value}`);
  }
}
