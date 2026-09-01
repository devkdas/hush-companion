import { describe, expect, it } from 'vitest';
import { preparePagesHtml } from '../scripts/prepare-pages.mjs';

describe('preparePagesHtml', () => {
  it('rewrites root favicon URLs to the Pages base path', () => {
    const input = '<script type="module" src="/hush-companion/assets/app.js"></script><link href="/favicon.svg"><link href="/favicon.svg">';
    expect(preparePagesHtml(input)).toBe('<script type="module" src="/hush-companion/assets/app.js"></script><link href="/hush-companion/favicon.svg"><link href="/hush-companion/favicon.svg">');
  });

  it('supports a custom repository base path for favicons', () => {
    expect(preparePagesHtml('<link href="/favicon.svg">', '/project/'))
      .toBe('<link href="/project/favicon.svg">');
  });

  it('does not modify already-correct HTML', () => {
    const html = '<script src="/hush-companion/assets/app.js"></script>';
    expect(preparePagesHtml(html)).toBe(html);
  });
});
