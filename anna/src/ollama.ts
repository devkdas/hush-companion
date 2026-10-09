import { ChatMessage, ConversationSettings, localFallback, systemPrompt } from './conversation';

export type { ChatMessage, ConversationSettings } from './conversation';

// Anna AI OS: only Gemini BYOK + Anna host LLM. Ollama removed.
export type AIProvider = 'gemini' | 'anna';

export interface AIConfig {
  provider: AIProvider;
  geminiApiKey?: string;
  geminiModel?: string;
}

export const defaultAIConfig: AIConfig = {
  provider: 'anna',
  geminiModel: 'gemini-2.5-flash',
};

// ── Anna host LLM ──────────────────────────────────────────────────────────────
// Uses the Anna App Runtime SDK injected by the host iframe.
// Falls back to localFallback if anna global is not available.
declare global {
  interface Window {
    anna?: {
      llm: {
        complete: (opts: {
          system?: string;
          messages: Array<{ role: 'user' | 'assistant'; content: string }>;
          model?: string;
          temperature?: number;
        }) => Promise<{ content: string }>;
      };
      storage: {
        get: (key: string) => Promise<unknown>;
        set: (key: string, value: unknown) => Promise<void>;
        delete: (key: string) => Promise<void>;
      };
      audio: {
        speak: (opts: { text: string; voice?: string }) => Promise<void>;
        transcribe: (opts: { audioBase64: string; language?: string }) => Promise<{ text: string }>;
      };
      window: {
        ready: () => void;
        set_title: (title: string) => void;
      };
    };
  }
}

export async function* streamAnna(
  settings: ConversationSettings,
  messages: ChatMessage[],
): AsyncGenerator<string> {
  try {
    if (!window.anna?.llm?.complete) {
      yield localFallback(settings);
      return;
    }
    const result = await window.anna.llm.complete({
      system: systemPrompt(settings),
      messages: messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      model: 'auto',
      temperature: settings.mode === 'vent' ? 0.7 : 0.5,
    });
    // Anna llm.complete returns the full response (not streaming).
    // Yield in sentence-sized chunks for the TTS queue to work.
    const text = result.content ?? '';
    const chunks = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
    for (const chunk of chunks) {
      if (chunk.trim()) yield chunk;
    }
  } catch (err) {
    yield `Anna LLM could not respond. ${err instanceof Error ? err.message : 'Please try again.'}`;
  }
}

// ── Gemini BYOK ───────────────────────────────────────────────────────────────
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
  model = 'gemini-2.5-flash',
): AsyncGenerator<string> {
  try {
    const trimmedKey = apiKey.trim();
    if (
      trimmedKey.startsWith('{') ||
      trimmedKey.startsWith('[') ||
      trimmedKey.includes(' ') ||
      trimmedKey.length < 30
    ) {
      throw new Error(
        'The configured Gemini key is not valid. Open AI settings and paste only the complete Google AI Studio key.',
      );
    }
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': trimmedKey },
      body: JSON.stringify(messagesForGemini(settings, messages)),
    });
    if (!response.ok) {
      let detail = '';
      try {
        const error = (await response.json()) as { error?: { message?: string } };
        detail = error.error?.message ?? '';
      } catch { /* ignore */ }
      throw new Error(`Gemini request failed (${response.status})${detail ? `: ${detail}` : ''}`);
    }
    if (!response.body) throw new Error('Gemini returned an empty response.');
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

// ── Main dispatcher ───────────────────────────────────────────────────────────
export async function* streamAI(
  settings: ConversationSettings,
  messages: ChatMessage[],
  config: AIConfig = defaultAIConfig,
): AsyncGenerator<string> {
  if (config.provider === 'gemini' && config.geminiApiKey?.trim()) {
    yield* streamGemini(settings, messages, config.geminiApiKey, config.geminiModel);
    return;
  }
  // Default: Anna host LLM (no key needed, uses user's Anna credits)
  yield* streamAnna(settings, messages);
}
