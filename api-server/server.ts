import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

const port = Number(process.env.PORT ?? 3000);
const host = process.env.BIND_HOST ?? '127.0.0.1';
const ollamaUrl = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const kokoroUrl = process.env.KOKORO_URL ?? 'http://127.0.0.1:8000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

export async function buildApp() {
  const app = Fastify({ logger: false, bodyLimit: 64 * 1024 });

  await app.register(cors, { origin: allowedOrigins });
  await app.register(rateLimit, { max: 30, timeWindow: '1 minute' });

  app.get('/health', async () => ({ ok: true }));

  app.post<{ Body: { model?: string; stream?: boolean; messages?: unknown[]; options?: unknown } }>('/api/chat', async (request, reply) => {
    const { model, messages } = request.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) return reply.code(400).send({ error: 'messages must be a non-empty array.' });
    if (model !== undefined && (typeof model !== 'string' || !model.trim())) return reply.code(400).send({ error: 'model must be a non-empty string.' });
    const response = await fetch(`${ollamaUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...request.body, stream: true }) });
    reply.code(response.status).header('content-type', response.headers.get('content-type') ?? 'application/x-ndjson');
    return reply.send(response.body);
  });

  app.post<{ Body: { text: string; voice?: 'system' | 'male' | 'female' } }>('/api/tts', async (request, reply) => {
    if (!request.body?.text || request.body.text.length > 4000) return reply.code(400).send({ error: 'Text must be between 1 and 4000 characters.' });
    const response = await fetch(`${kokoroUrl}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request.body) });
    reply.code(response.status).header('content-type', response.headers.get('content-type') ?? 'audio/wav');
    return reply.send(response.body);
  });

  return app;
}

// Only start the real HTTP server when executed directly (not imported by tests).
if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const app = await buildApp();
  await app.listen({ port, host });
}
