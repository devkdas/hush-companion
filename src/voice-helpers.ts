export type LocalVoice = 'system' | 'male' | 'female';

export function ttsEndpoint(apiUrl: string | undefined): string {
  const base = apiUrl ?? 'http://localhost:8000';
  return `${base.replace(/\/$/, '')}/api/tts`;
}

export function cleanListenText(text: string): string {
  return text.replace(/\([^)]*\)/g, '').replace(/\s{2,}/g, ' ').trim();
}
