import { VoicePreferences } from './conversation';
import { ttsEndpoint, type LocalVoice } from './voice-helpers';

export interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type RecognitionConstructor = new () => BrowserSpeechRecognition;

declare global { interface Window { webkitSpeechRecognition?: RecognitionConstructor; SpeechRecognition?: RecognitionConstructor; } }

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && !!(window.SpeechRecognition ?? window.webkitSpeechRecognition);
}

export function createRecognition(onText: (text: string) => void, onEnd: () => void): BrowserSpeechRecognition | null {
  const Constructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  if (!Constructor) return null;
  const recognition = new Constructor(); recognition.continuous = false; recognition.interimResults = false; recognition.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
  recognition.onresult = (event) => onText(event.results[0][0].transcript); recognition.onend = onEnd; recognition.onerror = onEnd; return recognition;
}

export function preferredVoice(preferences: VoicePreferences, voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith('en')); const candidates = english.length ? english : voices;
  if (preferences.profile === 'system') return candidates[0];
  const keywords = preferences.profile === 'masculine' ? ['male', 'man', 'david', 'alex', 'daniel', 'mark'] : ['female', 'woman', 'samantha', 'victoria', 'karen', 'zira'];
  return candidates.find((voice) => keywords.some((keyword) => voice.name.toLowerCase().includes(keyword))) ?? candidates[0];
}

let activeAudio: HTMLAudioElement | null = null; let activeAudioCancel: (() => void) | null = null; let activeSpeechCancel: (() => void) | null = null; let activeTtsController: AbortController | null = null; let speechGeneration = 0;
export function stopSpeaking(): void { speechGeneration += 1; activeTtsController?.abort(); activeTtsController = null; activeSpeechCancel?.(); activeSpeechCancel = null; activeAudioCancel?.(); activeAudioCancel = null; if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio.src = ''; activeAudio = null; } }

export function createVoiceGate(onVoice: () => void): { start: () => Promise<boolean>; stop: () => void } {
  let context: AudioContext | null = null; let stream: MediaStream | null = null; let source: MediaStreamAudioSourceNode | null = null; let analyser: AnalyserNode | null = null; let frame = 0; let active = false; let speakingFrames = 0; let lastVoice = 0;
  const start = async () => { if (active || !navigator.mediaDevices?.getUserMedia) return false; stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }); context = new AudioContext(); source = context.createMediaStreamSource(stream); analyser = context.createAnalyser(); analyser.fftSize = 512; source.connect(analyser); const data = new Uint8Array(analyser.fftSize); active = true;
    const check = () => { if (!active || !analyser) return; analyser.getByteTimeDomainData(data); let sum = 0; for (const value of data) { const normalized = (value - 128) / 128; sum += normalized * normalized; } const rms = Math.sqrt(sum / data.length); const now = performance.now(); if (rms > 0.035) { speakingFrames += 1; if (speakingFrames >= 3 && now - lastVoice > 1200) { lastVoice = now; if (context?.state === 'running') onVoice(); } } else speakingFrames = 0; frame = requestAnimationFrame(check); }; check(); return true; };
  const stop = () => { active = false; cancelAnimationFrame(frame); source?.disconnect(); analyser?.disconnect(); stream?.getTracks().forEach((track) => track.stop()); void context?.close(); context = null; stream = null; source = null; analyser = null; };
  return { start, stop };
}

export async function speakLocal(text: string, voice: LocalVoice = 'system', onStart?: () => void, onEnd?: () => void): Promise<boolean> { const generation = speechGeneration; const ttsBaseUrl = import.meta.env.VITE_TTS_URL; if (!text.trim() || !ttsBaseUrl) return false; const controller = new AbortController(); activeTtsController = controller; try { const response = await fetch(ttsEndpoint(ttsBaseUrl), { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voice }) }); if (!response.ok) throw new Error(`Local TTS failed: ${response.status}`); if (generation !== speechGeneration) return false; const audio = new Audio(URL.createObjectURL(await response.blob())); activeTtsController = null; activeAudio = audio; return await new Promise<boolean>((resolve) => { let settled = false; const finish = (success: boolean) => { if (settled) return; settled = true; activeAudioCancel = null; URL.revokeObjectURL(audio.src); if (activeAudio === audio) activeAudio = null; onEnd?.(); resolve(success); }; activeAudioCancel = () => finish(false); audio.onended = () => finish(true); audio.onerror = () => finish(false); onStart?.(); void audio.play().catch(() => finish(false)); }); } catch { if (activeTtsController === controller) activeTtsController = null; return false; } }

export function speakChunk(text: string, preferences: VoicePreferences, onEnd?: () => void): Promise<void> { return new Promise((resolve) => { let settled = false; const finish = () => { if (settled) return; settled = true; activeSpeechCancel = null; onEnd?.(); resolve(); }; if (!text.trim() || !('speechSynthesis' in window)) { finish(); return; } const utterance = new SpeechSynthesisUtterance(text.trim()); utterance.voice = preferredVoice(preferences, window.speechSynthesis.getVoices()) ?? null; utterance.rate = preferences.speed === 'slow' ? 0.85 : preferences.speed === 'fast' ? 1.15 : 1; utterance.pitch = preferences.profile === 'masculine' ? 0.85 : preferences.profile === 'feminine' ? 1.08 : 1; activeSpeechCancel = finish; utterance.onend = finish; utterance.onerror = finish; window.speechSynthesis.speak(utterance); }); }
export function speak(text: string, preferences: VoicePreferences, onEnd?: () => void): void { if (!('speechSynthesis' in window)) { onEnd?.(); return; } stopSpeaking(); const utterance = new SpeechSynthesisUtterance(text); let settled = false; const finish = () => { if (settled) return; settled = true; activeSpeechCancel = null; onEnd?.(); }; utterance.voice = preferredVoice(preferences, window.speechSynthesis.getVoices()) ?? null; utterance.rate = preferences.speed === 'slow' ? 0.85 : preferences.speed === 'fast' ? 1.15 : 1; utterance.pitch = preferences.profile === 'masculine' ? 0.85 : preferences.profile === 'feminine' ? 1.08 : 1; activeSpeechCancel = finish; utterance.onend = finish; utterance.onerror = finish; window.speechSynthesis.speak(utterance); }
