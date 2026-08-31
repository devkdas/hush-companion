import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearGeminiApiKey, geminiApiKeyIssue, hasGeminiApiKey, loadAIConfig, maskedApiKey, providerLabel, saveAIConfig } from '../src/ai-config';
import { defaultAIConfig } from '../src/ollama';

function createLocalStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() { return values.size; },
  };
}

describe('AI configuration helpers', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorage());
  });

  it('saves and loads provider settings from browser storage', () => {
    const config = { ...defaultAIConfig, provider: 'gemini' as const, geminiApiKey: 'test-gemini-key-example', geminiModel: 'gemini-test' };
    saveAIConfig(config);

    expect(loadAIConfig()).toMatchObject(config);
  });

  it('merges stored settings with defaults', () => {
    localStorage.setItem('hush-ai-config', JSON.stringify({ provider: 'ollama', ollamaModel: 'llama3' }));

    expect(loadAIConfig()).toMatchObject({
      ...defaultAIConfig,
      provider: 'ollama',
      ollamaModel: 'llama3',
    });
  });

  it('removes malformed saved Gemini values while loading settings', () => {
    localStorage.setItem('hush-ai-config', JSON.stringify({ provider: 'gemini', geminiApiKey: '{"importEngagement":{}}' }));

    const config = loadAIConfig();

    expect(config.geminiApiKey).toBeUndefined();
    expect(JSON.parse(localStorage.getItem('hush-ai-config') ?? '{}')).not.toHaveProperty('geminiApiKey');
  });

  it('returns defaults when stored JSON is invalid', () => {
    localStorage.setItem('hush-ai-config', '{not-json');

    expect(loadAIConfig()).toEqual(defaultAIConfig);
  });

  it('clears the saved Gemini key without removing other settings', () => {
    saveAIConfig({ ...defaultAIConfig, provider: 'gemini', geminiApiKey: 'test-gemini-key-example', geminiModel: 'gemini-test' });

    const cleared = clearGeminiApiKey();

    expect(cleared.geminiApiKey).toBeUndefined();
    expect(cleared.geminiModel).toBe('gemini-test');
    expect(loadAIConfig().geminiApiKey).toBeUndefined();
  });

  it('detects only non-empty Gemini keys', () => {
    expect(hasGeminiApiKey({ ...defaultAIConfig, geminiApiKey: '  ' })).toBe(false);
    expect(hasGeminiApiKey({ ...defaultAIConfig, geminiApiKey: 'test-gemini-key-example' })).toBe(true);
  });

  it('does not persist non-string or malformed Gemini values', () => {
    saveAIConfig({ ...defaultAIConfig, provider: 'gemini', geminiApiKey: { importEngagement: {} } as unknown as string });

    expect(JSON.parse(localStorage.getItem('hush-ai-config') ?? '{}')).not.toHaveProperty('geminiApiKey');
  });

  it('warns when a saved value is not a Google AI Studio key', () => {
    expect(geminiApiKeyIssue('{"importEngagement":{}}')).toContain('not a Google AI Studio API key');
    expect(geminiApiKeyIssue('test-gemini-key-value')).toBeNull();
    expect(geminiApiKeyIssue('test-gemini-key-value')).toBeNull();
    expect(geminiApiKeyIssue(undefined)).toBeNull();
  });

  it('masks configured keys without exposing the full value', () => {
    expect(maskedApiKey(undefined)).toBe('Not configured');
    expect(maskedApiKey('short')).toBe('Configured');
    expect(maskedApiKey('  test-gemini-1234567890  ')).toBe('test…7890');
  });

  it('labels supported providers', () => {
    expect(providerLabel('gemini')).toBe('Google Gemini');
    expect(providerLabel('ollama')).toBe('Ollama');
  });
});
