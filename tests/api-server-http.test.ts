import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { buildApp } from '../api-server/server';

// Mock global fetch so tests never hit real network
const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

function makeUpstreamResponse(status: number, body: string, contentType = 'application/x-ndjson') {
  return {
    status,
    headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
    body: body,
    ok: status >= 200 && status < 300,
  };
}

describe('api-server HTTP endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeEach(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterEach(async () => {
    fetchMock.mockReset();
    await app.close();
  });

  // ── GET /health ─────────────────────────────────────────────────────────────
  it('GET /health returns { ok: true }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });

  // ── POST /api/chat validation ────────────────────────────────────────────────
  it('POST /api/chat 400 — empty messages array', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('messages must be a non-empty array.');
  });

  it('POST /api/chat 400 — messages not an array', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: 'hello' }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('messages must be a non-empty array.');
  });

  it('POST /api/chat 400 — blank model string', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: '   ', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('model must be a non-empty string.');
  });

  it('POST /api/chat proxies upstream response when valid', async () => {
    fetchMock.mockResolvedValue(makeUpstreamResponse(200, 'stream-data'));
    const res = await app.inject({
      method: 'POST', url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    // Should have forwarded the request to the Ollama URL
    expect(fetchMock.mock.calls[0][0]).toContain('/api/chat');
  });

  it('POST /api/chat passes model name through to upstream', async () => {
    fetchMock.mockResolvedValue(makeUpstreamResponse(200, 'ok'));
    await app.inject({
      method: 'POST', url: '/api/chat',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'gemma3:4b', messages: [{ role: 'user', content: 'Hi' }] }),
    });
    const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sentBody.model).toBe('gemma3:4b');
    expect(sentBody.stream).toBe(true);
  });

  // ── POST /api/tts validation ─────────────────────────────────────────────────
  it('POST /api/tts 400 — empty text', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/tts',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('Text must be between 1 and 4000 characters.');
  });

  it('POST /api/tts 400 — text over 4000 chars', async () => {
    const res = await app.inject({
      method: 'POST', url: '/api/tts',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'a'.repeat(4001) }),
    });
    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).error).toBe('Text must be between 1 and 4000 characters.');
  });

  it('POST /api/tts proxies upstream response when valid', async () => {
    fetchMock.mockResolvedValue(makeUpstreamResponse(200, 'audio-bytes', 'audio/wav'));
    const res = await app.inject({
      method: 'POST', url: '/api/tts',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world', voice: 'system' }),
    });
    expect(res.statusCode).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0][0]).toContain('/tts');
  });
});
