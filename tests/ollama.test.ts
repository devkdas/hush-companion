import { describe, expect, it, vi } from 'vitest';
import { streamAI, streamGemini, streamOllama } from '../src/ollama';

describe('AI clients', () => {
  it('streams message content from Gemini SSE events', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\ndata: {"candidates":[{"content":{"parts":[{"text":" there"}]}}]}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of streamGemini({ mode: 'vent', emotion: 'sad', responseStyle: 'listen' }, [{ role: 'user', content: 'Hi' }], 'test-gemini-key-1234567890')) chunks.push(chunk);
    expect(chunks.join('')).toBe('Hello there');
    expect(fetchMock).toHaveBeenCalledWith(expect.not.stringContaining('test-gemini-key-1234567890'), expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'x-goog-api-key': 'test-gemini-key-1234567890' }) }));
    const request = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { contents: Array<{ role: string }>; systemInstruction: { parts: Array<{ text: string }> }; generationConfig: { temperature: number } };
    expect(request.contents).toEqual([{ role: 'user', parts: [{ text: 'Hi' }] }]);
    expect(request.systemInstruction.parts[0].text).toContain('You are Hush Companion');
    expect(request.generationConfig.temperature).toBe(0.7);
    vi.unstubAllGlobals();
  });

  it('reports Gemini API errors instead of returning the offline fallback', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of streamGemini({ mode: 'vent', emotion: 'angry', responseStyle: 'Just listen' }, [{ role: 'user', content: 'Hi' }], 'test-gemini-invalid-key-1234567890')) chunks.push(chunk);
    expect(chunks.join('')).toContain('Gemini could not respond.');
    expect(chunks.join('')).toContain('API key not valid');
    expect(chunks.join('')).not.toContain('I’m here with you. It sounds like');
    vi.unstubAllGlobals();
  });

  it('rejects a malformed Gemini key before making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of streamGemini({ mode: 'vent', emotion: 'angry', responseStyle: 'Just listen' }, [], '{"importEngagement":{}}')) chunks.push(chunk);
    expect(chunks.join('')).toContain('configured Gemini key is not valid');
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('dispatches configured Gemini requests without using Ollama', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"Gemini response"}]}}]}\n\n'));
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of streamAI({ mode: 'debate', emotion: 'calm', responseStyle: 'balanced' }, [{ role: 'user', content: 'Hi' }], { provider: 'gemini', geminiApiKey: 'test-gemini-key-1234567890', geminiModel: 'gemini-test' })) chunks.push(chunk);
    expect(chunks.join('')).toBe('Gemini response');
    expect(fetchMock.mock.calls[0][0]).toContain('gemini-test');
    vi.unstubAllGlobals();
  });

  it('uses the local fallback without making a request when Gemini has no key', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const chunks: string[] = [];
    for await (const chunk of streamAI({ mode: 'listen', emotion: 'calm', responseStyle: 'calm explanation', topic: 'space' }, [{ role: 'user', content: 'Tell me about space' }], { provider: 'gemini' })) chunks.push(chunk);
    expect(chunks.join('')).toContain('calm starting point');
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('streams message content from Ollama JSON lines', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":{"content":"Hello"}}\n{"message":{"content":" there"}}\n'));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const chunks: string[] = [];
    for await (const chunk of streamOllama({ mode: 'vent', emotion: 'sad', responseStyle: 'listen' }, [{ role: 'user', content: 'Hi' }])) chunks.push(chunk);
    expect(chunks.join('')).toBe('Hello there');
    vi.unstubAllGlobals();
  });

  it('handles a final Ollama event without a trailing newline', async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"message":{"content":"Final chunk"}}'));
        controller.close();
      },
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    const chunks: string[] = [];
    for await (const chunk of streamOllama({ mode: 'vent', emotion: 'calm', responseStyle: 'listen' }, [{ role: 'user', content: 'Hi' }])) chunks.push(chunk);
    expect(chunks.join('')).toBe('Final chunk');
    vi.unstubAllGlobals();
  });

  it('falls back locally when Ollama is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const chunks: string[] = [];
    for await (const chunk of streamOllama({ mode: 'debate', emotion: 'calm', responseStyle: 'balanced' }, [{ role: 'user', content: 'Hi' }])) chunks.push(chunk);
    expect(chunks.join('')).toContain('work through it carefully');
    vi.unstubAllGlobals();
  });
});
