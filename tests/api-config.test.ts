import { describe, expect, it } from 'vitest';

function parseOrigins(value: string | undefined): string[] {
  return (value ?? 'http://localhost:5173').split(',').map((origin) => origin.trim());
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

  it('does not treat an empty origin as a valid configured origin', () => {
    expect(parseOrigins('')).toEqual(['']);
    expect(parseOrigins('https://hush.example.com,')).toEqual(['https://hush.example.com', '']);
  });
});
