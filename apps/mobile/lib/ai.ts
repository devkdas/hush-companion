export type MobileProvider = 'gemini' | 'ollama';

export type MobileMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type MobileSettings = {
  provider: MobileProvider;
  geminiApiKey?: string;
  geminiModel: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  mode: string;
  emotion?: string;
  responseStyle: string;
  topic?: string;
};

function systemPrompt(settings: MobileSettings) {
  const context = settings.emotion ? ` The user currently feels ${settings.emotion}.` : '';
  return `You are Hush Companion, a warm and concise voice companion.${context} They selected ${settings.mode} mode with the style “${settings.responseStyle}”.${settings.topic ? ` The topic is “${settings.topic}”.` : ''} Keep replies natural when spoken, use one or two short sentences at a time, and ask at most one question. Do not claim to be human, a therapist, or emergency support. Hush Companion is for reflection, learning, and everyday wellbeing—not diagnosis, treatment, or crisis support.`;
}

function fallback(settings: MobileSettings, input: string) {
  if (settings.mode === 'listen') return `Let’s explore ${settings.topic || 'that topic'} together. I’ll keep the explanation clear and easy to follow.`;
  if (settings.mode === 'wellness') return `I’m here with you. We can take this one small step at a time—what feels most present right now?`;
  if (settings.mode === 'debate') return `Let’s examine that carefully. What is the strongest reason someone might disagree?`;
  return input.trim() ? `I’m listening. What part feels most important to say next?` : 'I’m here when you’re ready.';
}

async function* streamGemini(settings: MobileSettings, messages: MobileMessage[]) {
  const key = settings.geminiApiKey?.trim();
  if (!key) {
    yield fallback(settings, messages[messages.length - 1]?.content ?? '');
    return;
  }
  try {
    // #2 — key in header, not URL query param (URL would leak key in logs/history)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(settings.geminiModel || 'gemini-2.5-flash')}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(settings) }] },
        contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })),
        generationConfig: { temperature: 0.7 },
      }),
    });
    // #8 — yield readable error instead of throwing, so callers get useful feedback
    if (!response.ok) {
      let detail = '';
      try { const err = await response.json() as { error?: { message?: string } }; detail = err.error?.message ?? ''; } catch { /* ignore */ }
      yield `Gemini could not respond (${response.status})${detail ? `: ${detail}` : ''}. Check your API key and try again.`;
      return;
    }
    if (!response.body) { yield 'Gemini returned an empty response.'; return; }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const text = line.replace(/^data:\s*/, '').trim();
        if (!text || text === '[DONE]') continue;
        try {
          const data = JSON.parse(text) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
          const chunk = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
          if (chunk) yield chunk;
        } catch {
          // Ignore incomplete SSE frames; the next frame completes them.
        }
      }
      if (done) break;
    }
  } catch (error) {
    yield `Gemini could not respond. ${error instanceof Error ? error.message : 'Check your network connection.'}`;
  }
}

async function* streamOllama(settings: MobileSettings, messages: MobileMessage[]) {
  const response = await fetch(`${settings.ollamaBaseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: settings.ollamaModel || 'gemma3:4b', stream: true, messages: [{ role: 'system', content: systemPrompt(settings) }, ...messages] }),
  });
  if (!response.ok || !response.body) throw new Error(`Ollama request failed (${response.status})`);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      // #3 — guard JSON.parse; a malformed chunk must not abort the entire stream
      try {
        const data = JSON.parse(line) as { message?: { content?: string } };
        if (data.message?.content) yield data.message.content;
      } catch {
        // skip malformed line
      }
    }
    if (done) break;
  }
}

export async function* streamMobileAI(settings: MobileSettings, messages: MobileMessage[]) {
  try {
    yield* (settings.provider === 'gemini' ? streamGemini(settings, messages) : streamOllama(settings, messages));
  } catch (error) {
    console.warn('[Hush Companion mobile] AI request failed', error);
    yield fallback(settings, messages[messages.length - 1]?.content ?? '');
  }
}
