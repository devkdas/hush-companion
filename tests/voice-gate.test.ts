import { describe, it, expect, vi, afterEach } from 'vitest';
import { createVoiceGate } from '../src/voice';

// ── Browser API stubs ──────────────────────────────────────────────────────────
function makeAudioContextStub() {
  const analyser = {
    fftSize: 0,
    getByteTimeDomainData: vi.fn((data: Uint8Array) => data.fill(128)), // silence: all 128
    disconnect: vi.fn(),
  };
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  return {
    state: 'running' as AudioContextState,
    createAnalyser: vi.fn(() => analyser),
    createMediaStreamSource: vi.fn(() => source),
    close: vi.fn(() => Promise.resolve()),
    analyser,
    source,
  };
}

function makeStreamStub() {
  const track = { stop: vi.fn() };
  return {
    getTracks: vi.fn(() => [track]),
    track,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createVoiceGate', () => {
  it('returns an object with start and stop methods', () => {
    const gate = createVoiceGate(vi.fn());
    expect(typeof gate.start).toBe('function');
    expect(typeof gate.stop).toBe('function');
  });

  it('start() returns false when getUserMedia is unavailable', async () => {
    vi.stubGlobal('navigator', { mediaDevices: undefined });
    const gate = createVoiceGate(vi.fn());
    const result = await gate.start();
    expect(result).toBe(false);
  });

  it('start() returns true when getUserMedia succeeds', async () => {
    const ctx = makeAudioContextStub();
    const stream = makeStreamStub();
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const gate = createVoiceGate(vi.fn());
    const result = await gate.start();
    expect(result).toBe(true);

    gate.stop();
  });

  it('start() returns false on the second call (already active)', async () => {
    const ctx = makeAudioContextStub();
    const stream = makeStreamStub();
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const gate = createVoiceGate(vi.fn());
    await gate.start();
    const second = await gate.start();
    expect(second).toBe(false);

    gate.stop();
  });

  it('stop() disconnects source, stops tracks, and closes context', async () => {
    const ctx = makeAudioContextStub();
    const stream = makeStreamStub();
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const gate = createVoiceGate(vi.fn());
    await gate.start();
    gate.stop();

    expect(ctx.source.disconnect).toHaveBeenCalled();
    expect(stream.track.stop).toHaveBeenCalled();
    expect(ctx.close).toHaveBeenCalled();
  });

  it('after stop(), a second start() can succeed again', async () => {
    const ctx = makeAudioContextStub();
    const stream = makeStreamStub();
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const gate = createVoiceGate(vi.fn());
    await gate.start();
    gate.stop();
    const result = await gate.start();
    expect(result).toBe(true);

    gate.stop();
  });

  it('does not call onVoice when audio is silent (all 128 / RMS = 0)', async () => {
    const onVoice = vi.fn();
    const ctx = makeAudioContextStub();
    // analyser.getByteTimeDomainData already fills with 128 (silence) by default
    const stream = makeStreamStub();
    let rafCallback: FrameRequestCallback | null = null;
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { rafCallback = cb; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn(() => 0) });

    const gate = createVoiceGate(onVoice);
    await gate.start();

    // Trigger one animation frame with silent audio
    (rafCallback as FrameRequestCallback | null)?.(0);
    expect(onVoice).not.toHaveBeenCalled();

    gate.stop();
  });

  it('calls onVoice after 3 consecutive loud frames (rms > 0.035)', async () => {
    const onVoice = vi.fn();
    const ctx = makeAudioContextStub();
    // Override analyser to fill with loud audio: value 255 → normalized (255-128)/128 ≈ 0.992
    ctx.analyser.getByteTimeDomainData = vi.fn((data: Uint8Array) => data.fill(255));
    const stream = makeStreamStub();
    let rafCallback: FrameRequestCallback | null = null;
    let now = 5000; // start far from lastVoice=0 so the > 1200ms guard passes immediately
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { rafCallback = cb; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn(() => now) });

    const gate = createVoiceGate(onVoice);
    await gate.start();

    // Trigger 3 successive frames — each raises speakingFrames; onVoice fires on frame 3
    (rafCallback as FrameRequestCallback | null)?.(0); // speakingFrames = 1
    (rafCallback as FrameRequestCallback | null)?.(0); // speakingFrames = 2
    (rafCallback as FrameRequestCallback | null)?.(0); // speakingFrames = 3 → onVoice()

    expect(onVoice).toHaveBeenCalledOnce();

    gate.stop();
  });

  it('does not call onVoice again within 1200ms of the last trigger (debounce)', async () => {
    const onVoice = vi.fn();
    const ctx = makeAudioContextStub();
    ctx.analyser.getByteTimeDomainData = vi.fn((data: Uint8Array) => data.fill(255));
    const stream = makeStreamStub();
    let rafCallback: FrameRequestCallback | null = null;
    let now = 5000;
    vi.stubGlobal('navigator', {
      mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(stream) },
    });
    vi.stubGlobal('AudioContext', class { constructor() { return ctx; } });
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { rafCallback = cb; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.stubGlobal('performance', { now: vi.fn(() => now) });

    const gate = createVoiceGate(onVoice);
    await gate.start();

    // First burst — 3 frames → fires onVoice, sets lastVoice = 5000
    (rafCallback as FrameRequestCallback | null)?.(0);
    (rafCallback as FrameRequestCallback | null)?.(0);
    (rafCallback as FrameRequestCallback | null)?.(0);
    expect(onVoice).toHaveBeenCalledOnce();

    // Advance time by only 500ms (< 1200ms guard)
    now = 5500;
    // Another 3 loud frames — speakingFrames resets between bursts? No.
    // speakingFrames is already 3 after the first burst and doesn't reset (still loud).
    // now - lastVoice = 500 < 1200, so onVoice must NOT be called again
    (rafCallback as FrameRequestCallback | null)?.(0);
    expect(onVoice).toHaveBeenCalledOnce(); // still only once

    gate.stop();
  });
});
