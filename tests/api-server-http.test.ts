// @vitest-environment node
import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildApp } from '../api-server/server';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('api-server HTTP endpoints (integration)', () => {
  it('GET /health returns { ok: true }', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
    await app.close();
  });

  it('POST /api/chat returns 400 for empty messages array (B7)', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toMatch(/non-empty array/);
    await app.close();
  });

  it('POST /api/chat returns 502 when Ollama is unreachable (B7 regression)', async () => {
    // Stub fetch to simulate ECONNREFUSED
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' })));
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }] }),
    });
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toMatch(/unavailable/i);
    await app.close();
  });

  it('POST /api/tts returns 400 for empty text', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/tts',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('POST /api/tts returns 502 when Kokoro is unreachable (B7 regression)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' })));
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/tts',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world' }),
    });
    expect(res.statusCode).toBe(502);
    expect(JSON.parse(res.body).error).toMatch(/unavailable/i);
    await app.close();
  });
});
