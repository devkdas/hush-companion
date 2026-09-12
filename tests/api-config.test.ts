import { describe, expect, it } from 'vitest';

function parseOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);
}

describe('API proxy configuration', () => {
  it('uses localhost as the default allowed origin', () => {
    expect(parseOrigins(undefined)).toEqual(['http://localhost:5173']);
  });

  it('supports multiple trimmed allowed origins', () => {
    expect(parseOrigins(' http://localhost:5173, https://hush.example.com ')).toEqual([
      'http://localhost:5173',
      'https://hush.example.com',
    ]);
  });

  it('filters out empty strings from the origin list', () => {
    // empty string → no valid origins (real server returns [])
    expect(parseOrigins('')).toEqual([]);
    // trailing comma → trailing empty entry is filtered
    expect(parseOrigins('https://hush.example.com,')).toEqual(['https://hush.example.com']);
  });
});
