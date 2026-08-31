import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({ logger: true, bodyLimit: 64 * 1024 });
const port = Number(process.env.PORT ?? 3000);
const ollamaUrl = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434';
const kokoroUrl = process.env.KOKORO_URL ?? 'http://127.0.0.1:8000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean);

await app.register(cors, { origin: allowedOrigins });
await app.register(rateLimit, { max: 30, timeWindow: '1 minute' });

app.get('/health', async () => ({ ok: true }));

app.post<{ Body: { model?: string; stream?: boolean; messages?: unknown[]; options?: unknown } }>('/api/chat', async (request, reply) => {
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

await app.listen({ port, host: '127.0.0.1' });
