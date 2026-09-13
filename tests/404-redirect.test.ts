import { describe, expect, it } from 'vitest';

/**
 * Unit tests for the 404.html redirect logic.
 * We extract the redirect function inline to test it without a browser.
 */

// Mirror the dynamic logic in public/404.html exactly:
function buildRedirectUrl(pathname: string, search = ''): string {
  const segments = pathname.split('/').filter(Boolean);
  // segments.length > 1 means there is at least one path component after the base
  const base = segments.length > 1 ? '/' + segments[0] : '';
  const requested = pathname.startsWith(base + '/')
    ? pathname.slice(base.length) || '/'
    : pathname;
  return base + '/?path=' + encodeURIComponent(requested + search);
}

describe('404 redirect (GitHub Pages, base derived from first path segment)', () => {
  it('redirects root-with-trailing-slash path', () => {
    // '/hush-companion/' has only one non-empty segment — base is '', redirect via root
    expect(buildRedirectUrl('/hush-companion/')).toBe('/?path=%2Fhush-companion%2F');
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

  // Hash fragments are stripped by the browser before a 404 request is made,
  // so hash preservation is not possible via 404.html redirect in practice.

  it('strips the base prefix from the stored path', () => {
    const url = buildRedirectUrl('/hush-companion/wellness/grounding');
    expect(url).toBe('/hush-companion/?path=%2Fwellness%2Fgrounding');
  });

  it('falls back to no-base when there is only one path segment', () => {
    // pathname has no sub-path (segments.length === 1) → base is '' → redirect to /?path=...
    const url = buildRedirectUrl('/wellness');
    expect(url).toBe('/?path=%2Fwellness');
  });

  it('works with a different repo base name', () => {
    expect(buildRedirectUrl('/my-app/vent/sad')).toBe('/my-app/?path=%2Fvent%2Fsad');
  });
});
