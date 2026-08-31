import { defaultAIConfig, type AIConfig, type AIProvider } from './ollama';

const storageKey = 'hush-ai-config';

export function loadAIConfig(): AIConfig {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}') as Partial<AIConfig>;
    const config = { ...defaultAIConfig, ...saved };
    if (geminiApiKeyIssue(config.geminiApiKey)) {
      delete config.geminiApiKey;
      localStorage.setItem(storageKey, JSON.stringify(config));
    }
    return config;
  } catch {
    return { ...defaultAIConfig };
  }
}

export function saveAIConfig(config: AIConfig): void {
  const safeConfig = { ...config };
  if (typeof safeConfig.geminiApiKey !== 'string' || geminiApiKeyIssue(safeConfig.geminiApiKey)) delete safeConfig.geminiApiKey;
  localStorage.setItem(storageKey, JSON.stringify(safeConfig));
}

export function clearGeminiApiKey(): AIConfig {
  const config = loadAIConfig();
  delete config.geminiApiKey;
  saveAIConfig(config);
  return config;
}

export function hasGeminiApiKey(config: AIConfig): boolean {
  return typeof config.geminiApiKey === 'string' && Boolean(config.geminiApiKey.trim());
}

export function geminiApiKeyIssue(apiKey: unknown): string | null {
  if (apiKey !== undefined && typeof apiKey !== 'string') {
    return 'The saved Gemini value is not text. Clear it and paste only the Google AI Studio key value.';
  }
  const value = apiKey?.trim() ?? '';
  if (!value) return null;
  if (value.startsWith('{') || value.startsWith('[')) {
    return 'This is JSON or another data export, not a Google AI Studio API key. Clear it and paste only the key value.';
  }
  if (value.includes(' ')) {
    return 'This does not look like a Google AI Studio API key. Paste only the key value, without spaces or labels.';
  }
  return null;
}

export function maskedApiKey(apiKey: string | undefined): string {
  const value = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!value) return 'Not configured';
  if (value.length < 10) return 'Configured';
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
}

export function providerLabel(provider: AIProvider): string {
  return provider === 'gemini' ? 'Google Gemini' : 'Ollama';
}
