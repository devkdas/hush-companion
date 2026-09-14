import { describe, expect, it } from 'vitest';

/**
 * Mirrors the /api/chat validation logic from api-server/server.ts.
 * Tests the exact guard conditions that were added to secure the proxy endpoint.
 */
function validateChatBody(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'messages must be a non-empty array.';
  const { model, messages } = body as Record<string, unknown>;
  if (!Array.isArray(messages) || messages.length === 0) return 'messages must be a non-empty array.';
  if (model !== undefined && (typeof model !== 'string' || !String(model).trim()))
    return 'model must be a non-empty string.';
  return null;
}

describe('api-server /api/chat validation', () => {
  it('accepts a valid messages array with no model', () => {
    expect(validateChatBody({ messages: [{ role: 'user', content: 'Hello' }] })).toBeNull();
  });

  it('accepts messages with a valid model string', () => {
    expect(validateChatBody({ model: 'gemma3:4b', messages: [{ role: 'user', content: 'Hi' }] })).toBeNull();
  });

  it('rejects an empty messages array', () => {
    expect(validateChatBody({ messages: [] })).toBe('messages must be a non-empty array.');
  });

  it('rejects when messages is a string instead of an array', () => {
    expect(validateChatBody({ messages: 'hello' })).toBe('messages must be a non-empty array.');
  });

  it('rejects when messages is missing entirely', () => {
    expect(validateChatBody({})).toBe('messages must be a non-empty array.');
  });

  it('rejects when body is null', () => {
    expect(validateChatBody(null)).toBe('messages must be a non-empty array.');
  });

  it('rejects when model is a blank string', () => {
    expect(validateChatBody({ model: '   ', messages: [{ role: 'user', content: 'Hi' }] }))
      .toBe('model must be a non-empty string.');
  });

  it('rejects when model is a number', () => {
    expect(validateChatBody({ model: 42, messages: [{ role: 'user', content: 'Hi' }] }))
      .toBe('model must be a non-empty string.');
  });

  it('treats undefined model as "use server default" (valid)', () => {
    expect(validateChatBody({ messages: [{ role: 'user', content: 'Hi' }] })).toBeNull();
  });

  it('accepts multiple messages in the array', () => {
    expect(validateChatBody({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
        { role: 'user', content: 'How are you?' },
      ],
    })).toBeNull();
  });
});
