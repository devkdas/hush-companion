import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecognition, preferredVoice, speakChunk, stopSpeaking } from '../src/voice';

describe('voice playback', () => {
  afterEach(() => {
    stopSpeaking();
    vi.unstubAllGlobals();
  });

  it('configures recognition and forwards transcript and end events', () => {
    const onText = vi.fn();
    const onEnd = vi.fn();
    class FakeRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
    }
    vi.stubGlobal('window', { SpeechRecognition: FakeRecognition });

    const recognition = createRecognition(onText, onEnd);
    recognition?.onresult?.({ results: [{ 0: { transcript: 'Hello Hush Companion' } }] });
    recognition?.onend?.();

    expect(recognition).toMatchObject({ continuous: false, interimResults: false, lang: 'en-US' });
    expect(onText).toHaveBeenCalledWith('Hello Hush Companion');
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('selects the requested gendered voice and falls back to an English voice', () => {
    const voices = [
      { name: 'Alex', lang: 'en-US' },
      { name: 'Samantha', lang: 'en-US' },
      { name: 'Deutsch', lang: 'de-DE' },
    ] as SpeechSynthesisVoice[];

    expect(preferredVoice({ profile: 'masculine', speed: 'natural', tone: 'warm' }, voices)?.name).toBe('Alex');
    expect(preferredVoice({ profile: 'feminine', speed: 'natural', tone: 'warm' }, voices)?.name).toBe('Samantha');
    expect(preferredVoice({ profile: 'system', speed: 'natural', tone: 'warm' }, voices)?.name).toBe('Alex');
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
