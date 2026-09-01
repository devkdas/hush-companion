import { describe, expect, it } from 'vitest';
import { cleanListenText, ttsEndpoint } from '../src/voice-helpers';

describe('voice helpers', () => {
  it('builds local and configured TTS endpoints safely', () => {
    expect(ttsEndpoint(undefined)).toBe('http://localhost:8000/api/tts');
    expect(ttsEndpoint('https://api.example.com/')).toBe('https://api.example.com/api/tts');
    // no trailing slash
    expect(ttsEndpoint('https://api.example.com')).toBe('https://api.example.com/api/tts');
    // empty string falls back to localhost
    expect(ttsEndpoint('')).toBe('/api/tts');
  });

  it('removes parenthetical production directions from Listen text', () => {
    expect(cleanListenText('(Gentle, warm tone) Hello there.  Let us begin.')).toBe('Hello there. Let us begin.');
    // no parens — unchanged
    expect(cleanListenText('Hello there.')).toBe('Hello there.');
    // multiple parenthetical blocks
    expect(cleanListenText('(Intro) Welcome. (Pause) Enjoy.')).toBe('Welcome. Enjoy.');
    // only whitespace after removal
    expect(cleanListenText('(all removed)')).toBe('');
    // nested single-level parens
    expect(cleanListenText('Text (note one) and (note two) end.')).toBe('Text and end.');
  });
});
