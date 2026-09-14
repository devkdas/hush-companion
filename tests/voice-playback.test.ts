import { describe, it, expect, vi, afterEach } from 'vitest';
import { speakChunk, speak, stopSpeaking, speakLocal } from '../src/voice';

// Minimal SpeechSynthesisUtterance stub
class FakeUtterance {
  text: string;
  voice: SpeechSynthesisVoice | null = null;
  rate = 1;
  pitch = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) { this.text = text; }
}

function makeSynthesis(autoEnd = true) {
  const spokenUtterances: FakeUtterance[] = [];
  return {
    cancel: vi.fn(),
    getVoices: vi.fn(() => [] as SpeechSynthesisVoice[]),
    speak: vi.fn((u: FakeUtterance) => {
      spokenUtterances.push(u);
      if (autoEnd) queueMicrotask(() => u.onend?.());
    }),
    get utterances() { return spokenUtterances; },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── stopSpeaking ─────────────────────────────────────────────────────────────
describe('stopSpeaking', () => {
  it('cancels browser speech synthesis when available', () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    stopSpeaking();
    expect(synth.cancel).toHaveBeenCalledOnce();
  });

  it('does not throw when speechSynthesis is absent', () => {
    vi.stubGlobal('window', {});
    expect(() => stopSpeaking()).not.toThrow();
  });
});

// ─── speakChunk ───────────────────────────────────────────────────────────────
describe('speakChunk', () => {
  it('resolves and calls onEnd for blank text without speaking', async () => {
    const onEnd = vi.fn();
    await speakChunk('   ', { profile: 'system', speed: 'natural', tone: 'warm' }, onEnd);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('resolves and calls onEnd when speechSynthesis is absent', async () => {
    vi.stubGlobal('window', {});
    const onEnd = vi.fn();
    await speakChunk('Hello', { profile: 'system', speed: 'natural', tone: 'warm' }, onEnd);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('speaks via speechSynthesis and calls onEnd', async () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    const onEnd = vi.fn();
    await speakChunk('Hello world', { profile: 'system', speed: 'natural', tone: 'warm' }, onEnd);
    expect(synth.speak).toHaveBeenCalledOnce();
    expect(onEnd).toHaveBeenCalledOnce();
    expect(synth.utterances[0].text).toBe('Hello world');
  });

  it('applies slow rate (0.85) for slow speed', async () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    await speakChunk('Hello', { profile: 'system', speed: 'slow', tone: 'warm' });
    expect(synth.utterances[0].rate).toBe(0.85);
  });

  it('applies fast rate (1.15) for fast speed', async () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    await speakChunk('Hello', { profile: 'system', speed: 'fast', tone: 'warm' });
    expect(synth.utterances[0].rate).toBe(1.15);
  });

  it('applies lower pitch (0.85) for masculine profile', async () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    await speakChunk('Hello', { profile: 'masculine', speed: 'natural', tone: 'warm' });
    expect(synth.utterances[0].pitch).toBe(0.85);
  });

  it('applies higher pitch (1.08) for feminine profile', async () => {
    const synth = makeSynthesis();
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    await speakChunk('Hello', { profile: 'feminine', speed: 'natural', tone: 'warm' });
    expect(synth.utterances[0].pitch).toBe(1.08);
  });
});

// ─── speak ────────────────────────────────────────────────────────────────────
describe('speak', () => {
  it('calls onEnd immediately when speechSynthesis is absent', () => {
    vi.stubGlobal('window', {});
    const onEnd = vi.fn();
    speak('Hello', { profile: 'system', speed: 'natural', tone: 'warm' }, onEnd);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('starts browser speech for non-empty text', () => {
    const synth = makeSynthesis(false);
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    speak('Hello world', { profile: 'system', speed: 'natural', tone: 'warm' });
    expect(synth.speak).toHaveBeenCalledOnce();
    expect(synth.utterances[0].text).toBe('Hello world');
  });

  it('cancels any prior speech before starting new utterance', () => {
    const synth = makeSynthesis(false);
    vi.stubGlobal('window', { speechSynthesis: synth });
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    speak('First', { profile: 'system', speed: 'natural', tone: 'warm' });
    speak('Second', { profile: 'system', speed: 'natural', tone: 'warm' });
    // cancel called once per speak (stopSpeaking inside speak)
    expect(synth.cancel.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(synth.utterances[synth.utterances.length - 1].text).toBe('Second');
  });
});

// ─── speakLocal ───────────────────────────────────────────────────────────────
describe('speakLocal', () => {
  it('returns false when VITE_TTS_URL is not configured', async () => {
    // import.meta.env.VITE_TTS_URL is undefined in the vitest node environment
    expect(await speakLocal('Hello')).toBe(false);
  });

  it('returns false for blank text regardless of environment', async () => {
    expect(await speakLocal('   ')).toBe(false);
  });
});
