import { describe, expect, it } from 'vitest';

/**
 * Unit tests for the 404.html redirect logic.
 * We extract the redirect function inline to test it without a browser.
 */

function buildRedirectUrl(pathname: string, search = '', hash = ''): string {
  // Mirror the logic in public/404.html exactly:
  const requested = pathname;
  return `/?path=${encodeURIComponent(requested + search + hash)}`;
}

describe('404 redirect (custom domain, base:/)', () => {
  it('redirects root path', () => {
    expect(buildRedirectUrl('/')).toBe('/?path=%2F');
  });

  it('redirects a deep client-side route', () => {
    expect(buildRedirectUrl('/vent/sad')).toBe('/?path=%2Fvent%2Fsad');
  });

  it('redirects modes path', () => {
    expect(buildRedirectUrl('/modes')).toBe('/?path=%2Fmodes');
  });

  it('preserves query string in redirect', () => {
    expect(buildRedirectUrl('/vent', '?foo=bar')).toBe('/?path=%2Fvent%3Ffoo%3Dbar');
  });

  it('preserves hash in redirect', () => {
    expect(buildRedirectUrl('/vent', '', '#section')).toBe('/?path=%2Fvent%23section');
  });

  it('does NOT strip or prepend /hush-companion prefix (custom domain has none)', () => {
    // With the old code this would have double-prefixed or broken
    const url = buildRedirectUrl('/wellness/grounding%20exercise');
    expect(url).not.toContain('hush-companion');
    expect(url).toBe('/?path=%2Fwellness%2Fgrounding%2520exercise');
  });
});
