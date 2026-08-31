import { describe, expect, it } from 'vitest';
import { cleanListenText, ttsEndpoint } from '../src/voice-helpers';

describe('voice helpers', () => {
  it('builds local and configured TTS endpoints safely', () => {
    expect(ttsEndpoint(undefined)).toBe('http://localhost:8000/api/tts');
    expect(ttsEndpoint('https://api.example.com/')).toBe('https://api.example.com/api/tts');
  });

  it('removes parenthetical production directions from Listen text', () => {
    expect(cleanListenText('(Gentle, warm tone) Hello there.  Let us begin.')).toBe('Hello there. Let us begin.');
  });
});
