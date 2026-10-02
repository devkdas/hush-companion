// Anna edition: Kokoro TTS removed. Browser speechSynthesis only.
export type LocalVoice = 'male' | 'female' | 'system';

// Not used in Anna edition (no VITE_TTS_URL), kept for type compat
export function ttsEndpoint(_baseUrl: string): string {
  return `${_baseUrl}/tts`;
}

// cleanListenText: strips markdown-style formatting from listen mode responses
export function cleanListenText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/#{1,6}\s*/g, "").replace(/`([^`]+)`/g, "$1").trim();
}
