import { describe, expect, it } from 'vitest';

/**
 * Unit tests for the 404.html redirect logic.
 * We extract the redirect function inline to test it without a browser.
 */

const BASE = '/hush-companion';

function buildRedirectUrl(pathname: string, search = '', hash = ''): string {
  // Mirror the logic in public/404.html exactly:
  const requested = pathname.startsWith(BASE)
    ? pathname.slice(BASE.length) || '/'
    : pathname;
  return `${BASE}/?path=${encodeURIComponent(requested + search + hash)}`;
}

describe('404 redirect (GitHub Pages, base:/hush-companion/)', () => {
  it('redirects root path', () => {
    expect(buildRedirectUrl('/hush-companion/')).toBe('/hush-companion/?path=%2F');
  });

  it('redirects a deep client-side route', () => {
    expect(buildRedirectUrl('/hush-companion/vent/sad')).toBe('/hush-companion/?path=%2Fvent%2Fsad');
  });

  it('redirects modes path', () => {
    expect(buildRedirectUrl('/hush-companion/modes')).toBe('/hush-companion/?path=%2Fmodes');
  });

  it('preserves query string in redirect', () => {
    expect(buildRedirectUrl('/hush-companion/vent', '?foo=bar')).toBe('/hush-companion/?path=%2Fvent%3Ffoo%3Dbar');
  });

  it('preserves hash in redirect', () => {
    expect(buildRedirectUrl('/hush-companion/vent', '', '#section')).toBe('/hush-companion/?path=%2Fvent%23section');
  });

  it('strips the /hush-companion base prefix from the stored path', () => {
    const url = buildRedirectUrl('/hush-companion/wellness/grounding');
    expect(url).toBe('/hush-companion/?path=%2Fwellness%2Fgrounding');
  });

  it('falls back gracefully if base prefix is missing', () => {
    // pathname doesn't start with /hush-companion — pass through as-is
    const url = buildRedirectUrl('/wellness');
    expect(url).toBe('/hush-companion/?path=%2Fwellness');
  });
});
