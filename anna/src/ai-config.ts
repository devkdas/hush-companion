import { defaultAIConfig, type AIConfig, type AIProvider } from './ollama';

const storageKey = 'hush-ai-config';

// ── Anna storage helpers ──────────────────────────────────────────────────────
// Use Anna's persistent storage when available, fall back to localStorage.
async function annaSave(config: AIConfig): Promise<void> {
  if (window.anna?.storage?.set) {
    await window.anna.storage.set(storageKey, config);
  }
  localStorage.setItem(storageKey, JSON.stringify(config));
}

async function annaLoad(): Promise<Partial<AIConfig> | null> {
  if (window.anna?.storage?.get) {
    const saved = await window.anna.storage.get(storageKey);
    if (saved && typeof saved === 'object') return saved as Partial<AIConfig>;
  }
  return null;
}

// ── Sync load (for initial render) ───────────────────────────────────────────
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

// ── Async load (pulls from Anna storage on mount) ────────────────────────────
export async function loadAIConfigAsync(): Promise<AIConfig> {
  try {
    const saved = await annaLoad();
    if (saved) {
      const config = { ...defaultAIConfig, ...saved };
      if (geminiApiKeyIssue(config.geminiApiKey)) delete config.geminiApiKey;
      return config;
    }
  } catch { /* ignore */ }
  return loadAIConfig();
}

export function saveAIConfig(config: AIConfig): void {
  const safeConfig = { ...config };
  if (typeof safeConfig.geminiApiKey !== 'string' || geminiApiKeyIssue(safeConfig.geminiApiKey)) {
    delete safeConfig.geminiApiKey;
  }
  // Fire-and-forget Anna storage save alongside localStorage
  void annaSave(safeConfig);
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
  const value = (apiKey as string | undefined)?.trim() ?? '';
  if (!value) return null;
  if (value.startsWith('{') || value.startsWith('[')) {
    return 'This is JSON or another data export, not a Google AI Studio API key.';
  }
  if (value.includes(' ')) {
    return 'This does not look like a Google AI Studio API key.';
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
  return provider === 'gemini' ? 'Google Gemini (your key)' : 'Anna AI (built-in)';
}
