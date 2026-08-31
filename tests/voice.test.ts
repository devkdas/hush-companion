import { afterEach, describe, expect, it, vi } from 'vitest';
import { speakChunk, stopSpeaking } from '../src/voice';

describe('voice playback', () => {
  afterEach(() => {
    stopSpeaking();
    vi.unstubAllGlobals();
  });

  it('settles and cancels an active browser utterance when playback stops', async () => {
    let utterance: { onend: (() => void) | null; onerror: (() => void) | null } | undefined;
    const cancel = vi.fn();
    vi.stubGlobal('window', {
      speechSynthesis: {
        cancel,
        getVoices: () => [],
        speak: (value: typeof utterance) => { utterance = value ?? undefined; },
      },
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      voice = null;
      rate = 1;
      pitch = 1;
      constructor(public text: string) {}
    });

    let finished = 0;
    const playback = speakChunk('A short response.', { profile: 'system', speed: 'natural', tone: 'warm' }, () => { finished += 1; });
    stopSpeaking();

    await expect(playback).resolves.toBeUndefined();
    expect(cancel).toHaveBeenCalledOnce();
    expect(finished).toBe(1);
    expect(utterance).toBeDefined();
  });
});
