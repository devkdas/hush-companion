import { ChatMessage, ConversationSettings, localFallback, systemPrompt } from './conversation';

export type { ChatMessage, ConversationSettings } from './conversation';

export type AIProvider = 'gemini' | 'ollama';

export interface AIConfig {
  provider: AIProvider;
  geminiApiKey?: string;
  geminiModel?: string;
  ollamaBaseUrl?: string;
  ollamaModel?: string;
}

export const defaultAIConfig: AIConfig = {
  provider: 'gemini',
  geminiModel: import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.5-flash',
  ollamaBaseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:11434',
  ollamaModel: import.meta.env.VITE_OLLAMA_MODEL ?? 'gemma3:4b',
};

function messagesForGemini(settings: ConversationSettings, messages: ChatMessage[]) {
  return {
    systemInstruction: { parts: [{ text: systemPrompt(settings) }] },
    contents: messages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    })),
    generationConfig: { temperature: settings.mode === 'vent' ? 0.7 : 0.5 },
  };
}

function parseGeminiEvent(line: string): string {
  if (!line.startsWith('data:')) return '';
  try {
    const event = JSON.parse(line.slice(5).trim()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return event.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  } catch {
    return '';
  }
}

export async function* streamGemini(
  settings: ConversationSettings,
  messages: ChatMessage[],
  apiKey: string,
  model = defaultAIConfig.geminiModel ?? 'gemini-2.5-flash',
): AsyncGenerator<string> {
  try {
    const trimmedKey = apiKey.trim();
    if (trimmedKey.startsWith('{') || trimmedKey.startsWith('[') || trimmedKey.includes(' ') || trimmedKey.length < 12) throw new Error('The configured Gemini key is not valid. Open AI settings and paste only the complete Google AI Studio key.');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': trimmedKey },
      body: JSON.stringify(messagesForGemini(settings, messages)),
    });
    if (!response.ok) { let detail = ''; try { const error = await response.json() as { error?: { message?: string } }; detail = error.error?.message ?? ''; } catch { /* Keep the HTTP status when the provider does not return JSON. */ } throw new Error(`Gemini request failed (${response.status})${detail ? `: ${detail}` : ''}`); } if (!response.body) throw new Error('Gemini returned an empty response.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const chunk = parseGeminiEvent(line.trim());
        if (chunk) yield chunk;
      }
    }
    const finalChunk = parseGeminiEvent(buffer.trim());
    if (finalChunk) yield finalChunk;
  } catch (error) {
    yield `Gemini could not respond. ${error instanceof Error ? error.message : 'Check your API key, model, quota, and network connection.'}`;
  }
}

function parseOllamaLine(line: string): string {
  if (!line.trim()) return '';
  try {
    const chunk = JSON.parse(line) as { message?: { content?: string } };
    return chunk.message?.content ?? '';
  } catch {
    return '';
  }
}

export async function* streamOllama(
  settings: ConversationSettings,
  messages: ChatMessage[],
  config: Pick<AIConfig, 'ollamaBaseUrl' | 'ollamaModel'> = defaultAIConfig,
): AsyncGenerator<string> {
  try {
    const baseUrl = config.ollamaBaseUrl ?? 'http://localhost:11434';
    const model = config.ollamaModel ?? 'gemma3:4b';
    const prompt = systemPrompt(settings);
    if (import.meta.env.DEV) console.debug('[Hush Companion] Injected Ollama system prompt:', prompt);
    const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    const response = await fetch(`${apiBase}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: 'system', content: prompt }, ...messages],
        options: { temperature: settings.mode === 'vent' ? 0.7 : 0.5 },
      }),
    });
    if (!response.ok || !response.body) throw new Error(`Ollama request failed: ${response.status}`);
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const content = parseOllamaLine(line);
        if (content) yield content;
      }
    }
    const finalContent = parseOllamaLine(buffer);
    if (finalContent) yield finalContent;
  } catch {
    yield localFallback(settings);
  }
}

export async function* streamAI(
  settings: ConversationSettings,
  messages: ChatMessage[],
  config: AIConfig = defaultAIConfig,
): AsyncGenerator<string> {
  if (config.provider === 'gemini') {
    if (config.geminiApiKey?.trim()) {
      yield* streamGemini(settings, messages, config.geminiApiKey, config.geminiModel);
    } else {
      yield localFallback(settings);
    }
    return;
  }
  yield* streamOllama(settings, messages, config);
}
