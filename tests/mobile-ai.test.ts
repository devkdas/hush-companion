import { describe, expect, it, vi } from 'vitest';
import { streamMobileAI, type MobileMessage, type MobileSettings } from '../apps/mobile/lib/ai';

const baseSettings: MobileSettings = {
  provider: 'gemini',
  geminiModel: 'gemini-2.5-flash',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'gemma3:4b',
  mode: 'vent',
  responseStyle: 'Just listen',
};

async function collect(settings: MobileSettings, messages: MobileMessage[]) {
  const chunks: string[] = [];
  for await (const chunk of streamMobileAI(settings, messages)) chunks.push(chunk);
  return chunks.join('');
}

describe('mobile AI client', () => {
  it('provides a local fallback when Gemini has no key', async () => {
    await expect(collect(baseSettings, [{ role: 'user', content: 'Hello' }])).resolves.toContain('I’m listening');
  });

  it('provides a local fallback when the provider request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(collect({ ...baseSettings, provider: 'ollama' }, [{ role: 'user', content: 'Hello' }])).resolves.toContain('I’m listening');
    vi.unstubAllGlobals();
  });
});
