import { describe, expect, it } from 'vitest';
import { verifyPagesHtml } from '../scripts/verify-pages.mjs';

const BASE = '/hush-companion';
const VALID = `<script src="${BASE}/assets/app.js"></script><link href="${BASE}/favicon.svg">`;

describe('verifyPagesHtml', () => {
  it('passes for correctly prepared HTML', () => {
    expect(() => verifyPagesHtml(VALID)).not.toThrow();
  });

  it('throws when assets path is missing', () => {
    const html = `<link href="${BASE}/favicon.svg">`;
    expect(() => verifyPagesHtml(html)).toThrow(`Missing generated path: ${BASE}/assets/`);
  });

  it('throws when favicon path is missing', () => {
    const html = `<script src="${BASE}/assets/app.js"></script>`;
    expect(() => verifyPagesHtml(html)).toThrow(`Missing generated path: ${BASE}/favicon.svg`);
  });

  it('throws when the raw src/main.tsx entry is still present', () => {
    expect(() => verifyPagesHtml(VALID + '<script src="/src/main.tsx"></script>'))
      .toThrow('Forbidden source path: src="/src/main.tsx"');
  });

  it('throws when a bare favicon href is still present', () => {
    expect(() => verifyPagesHtml(VALID + '<link href="favicon.svg">'))
      .toThrow('Forbidden source path: href="favicon.svg"');
  });

  it('throws when a root-relative favicon href is still present', () => {
    expect(() => verifyPagesHtml(VALID + '<link href="/favicon.svg">'))
      .toThrow('Forbidden source path: href="/favicon.svg"');
  });

  it('accepts a custom base path', () => {
    const html = '<script src="/my-app/assets/app.js"></script><link href="/my-app/favicon.svg">';
    expect(() => verifyPagesHtml(html, '/my-app')).not.toThrow();
  });

  it('throws for custom base when assets path is wrong', () => {
    const html = '<script src="/hush-companion/assets/app.js"></script><link href="/my-app/favicon.svg">';
    expect(() => verifyPagesHtml(html, '/my-app')).toThrow('Missing generated path: /my-app/assets/');
  });
});
