import { StrictMode, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft, ArrowRight, FileText, Heart, Lightbulb,
  Mic, Moon, ShieldCheck, Sparkles, Sun, Volume2, Waves, Zap,
} from 'lucide-react';
import './styles.css';

import { streamAI, type AIConfig, type ChatMessage, type ConversationSettings } from './ollama';
import { hasGeminiApiKey, loadAIConfig, saveAIConfig } from './ai-config';
import {
  createRecognition, createVoiceGate, isSpeechRecognitionSupported,
  speak, speakChunk, speakLocal, stopSpeaking, type BrowserSpeechRecognition,
} from './voice';
import {
  appPath as normalizeAppPath, contextPath, modeFromPath,
  pathFor, publicPath as makePublicPath, transcriptText,
  type AppMode, type AppScreen,
} from './app-helpers';
import { cleanListenText } from './voice-helpers';

import { Call } from './components/Call';
import { Setup } from './components/Setup';
import { InfoModal } from './components/InfoModal';
import { LegalModal } from './components/LegalModal';
import { LeaveModal } from './components/LeaveModal';
import { AISettings, VoiceSettings } from './components/Settings';
import type { CallPhase, InfoPanel, LegalDocument, Mode, Screen, VoiceProfile } from './types';
import { modeStyles } from './types';

// ─── Path helpers ────────────────────────────────────────────────────────────
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// ─── AI send helper ──────────────────────────────────────────────────────────
async function send(
  content: string,
  settings: ConversationSettings,
  messages: ChatMessage[],
  onMessages: (messages: ChatMessage[]) => void,
  voice: VoiceProfile,
  speed: 'slow' | 'natural' | 'fast',
  aiConfig: AIConfig,
  speechRunRef: { current: number },
  ttsQueueRef: { current: Promise<void> },
  onSpeechEnd?: () => void,
  onSpeechStart?: () => void,
) {
  const next = [...messages, { role: 'user' as const, content }];
  onMessages(next);
  let answer = '';
  let spoken = '';
  const preferences = { profile: voice, speed, tone: 'warm' as const };
  const run = speechRunRef.current;

  const queueChunk = (chunk: string, final = false) => {
    chunk = settings.mode === 'listen' ? cleanListenText(chunk) : chunk;
    if (!chunk.trim()) { if (final) onSpeechEnd?.(); return; }
    ttsQueueRef.current = ttsQueueRef.current.then(async () => {
      if (run !== speechRunRef.current) return;
      const local = await speakLocal(
        chunk,
        voice === 'masculine' ? 'male' : voice === 'feminine' ? 'female' : 'system',
        onSpeechStart,
      );
      if (run !== speechRunRef.current) return;
      if (!local) await speakChunk(chunk, preferences, undefined);
      if (run === speechRunRef.current && final) onSpeechEnd?.();
    }).catch(() => undefined);
  };

  for await (const chunk of streamAI(settings, next, aiConfig)) {
    answer += chunk;
    onMessages([...next, {
      role: 'assistant',
      content: settings.mode === 'listen' ? cleanListenText(answer) : answer,
    }]);
    const ready = answer.slice(spoken.length).match(/^.*?[.!?](?:\s|$)/);
    if (ready) { const part = ready[0]; spoken += part; queueChunk(part); }
  }
  const remainder = answer.slice(spoken.length);
  if (remainder.trim()) queueChunk(remainder);
  ttsQueueRef.current = ttsQueueRef.current.then(() => {
    if (run === speechRunRef.current) onSpeechEnd?.();
  });
}

// ─── Small presentational components ─────────────────────────────────────────
function Feature({ icon, tone, title, text }: { icon: ReactNode; tone: 'peach' | 'lavender' | 'mint'; title: string; text: string }) {
  return (
    <div className="feature">
      <span className={`feature-icon ${tone}`}>{icon}</span>
      <div><strong>{title}</strong><span>{text}</span></div>
    </div>
  );
}

function ModeCard({ mode, title, description, onClick }: { mode: Mode; title: string; description: string; onClick: (mode: Mode) => void }) {
  const icon =
    mode === 'vent' ? <Heart size={22} /> :
    mode === 'debate' ? <Zap size={22} /> :
    mode === 'listen' ? <Volume2 size={22} /> :
    <Sparkles size={22} />;
  return (
    <button className={`mode-card ${mode}-card`} onClick={() => onClick(mode)}>
      <span className="card-icon">{icon}</span>
      <span className="card-label">{mode.toUpperCase()}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="card-link">Choose {mode} <ArrowRight size={16} /></span>
    </button>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const redirectedPath = new URLSearchParams(window.location.search).get('path');
  const initialPath = redirectedPath || normalizeAppPath(window.location.pathname, basePath);
  if (redirectedPath) window.history.replaceState({}, '', makePublicPath(initialPath, basePath));
  const initialMode = modeFromPath(initialPath) ?? 'vent';
  const speechSupported = isSpeechRecognitionSupported();

  // refs
  const speechRunRef = useRef(0);
  const ttsQueueRef = useRef(Promise.resolve());
  const voiceGateRef = useRef<ReturnType<typeof createVoiceGate> | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const conversationActiveRef = useRef(false);
  const recognitionStartingRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const callStateRef = useRef<CallPhase>('idle');

  // state
  const [callState, setCallState] = useState<CallPhase>('idle');
  const [screen, setScreen] = useState<Screen>(() =>
    modeFromPath(window.location.pathname) ? 'setup' :
    normalizeAppPath(window.location.pathname, basePath) === '/modes' ? 'mode' : 'welcome'
  );
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [infoPanel, setInfoPanel] = useState<InfoPanel | null>(null);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [emotion, setEmotion] = useState('Sad');
  const [style, setStyle] = useState('Just listen');
  const [topic, setTopic] = useState('');
  const [debatePrompt, setDebatePrompt] = useState('');
  const [voice, setVoice] = useState<VoiceProfile>('system');
  const [speed, setSpeed] = useState<'slow' | 'natural' | 'fast'>('natural');
  const [dark, setDark] = useState(() => localStorage.getItem('hush-theme') === 'dark');
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [aiConfig, setAIConfig] = useState<AIConfig>(() => loadAIConfig());

  // timer
  useEffect(() => {
    if (screen !== 'call') return;
    const id = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  const duration = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  // helpers
  const setCallPhase = (phase: CallPhase) => { callStateRef.current = phase; setCallState(phase); };
  const updateAIConfig = (next: AIConfig) => { setAIConfig(next); saveAIConfig(next); };
  const updateMessages = (next: ChatMessage[]) => { messagesRef.current = next; setMessages(next); };
  const settings: ConversationSettings = {
    mode, emotion, responseStyle: style,
    topic: mode === 'debate' ? debatePrompt : topic,
    voice: { profile: voice, speed, tone: 'warm' },
    listenStyle: 'calm',
  };

  const navigate = (nextScreen: Screen, nextMode = mode) => {
    const context = nextMode === 'vent' ? emotion : nextMode === 'debate' ? debatePrompt : topic;
    const path = pathFor(nextScreen, nextMode, context || undefined);
    const browserPath = makePublicPath(path, basePath);
    if (window.location.pathname !== browserPath) window.history.pushState({ screen: nextScreen, mode: nextMode }, '', browserPath);
    setScreen(nextScreen);
    setMode(nextMode);
  };

  // popstate
  useEffect(() => {
    const handlePopState = () => {
      const pathname = normalizeAppPath(window.location.pathname, basePath);
      const legal =
        pathname === '/terms' ? 'terms' :
        pathname === '/privacy' ? 'privacy' :
        pathname === '/ai-disclaimer' ? 'ai' : null;
      setLegalDocument(legal);
      const nextMode = modeFromPath(pathname);
      setMode(nextMode ?? 'vent');
      setScreen(nextMode ? 'setup' : pathname === '/modes' ? 'mode' : 'welcome');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // voice gate
  useEffect(() => {
    voiceGateRef.current = createVoiceGate(() => {
      if (speaking) { stopSpeaking(); setSpeaking(false); setCallPhase('listening'); }
    });
    return () => voiceGateRef.current?.stop();
  }, [speaking]);

  const scheduleListening = () => {
    if (!conversationActiveRef.current || muted || restartTimerRef.current) return;
    restartTimerRef.current = window.setTimeout(() => { restartTimerRef.current = null; beginListening(); }, 250);
  };

  const beginListening = () => {
    if (muted || recognitionStartingRef.current || listening || callStateRef.current === 'speaking') return;
    speechRunRef.current += 1;
    ttsQueueRef.current = Promise.resolve();
    stopSpeaking();
    void voiceGateRef.current?.start();
    setSpeaking(false);
    setCallPhase('listening');
    conversationActiveRef.current = true;
    const recognition = createRecognition(
      (text) => {
        setListening(false);
        setCallPhase('thinking');
        void send(text, settings, messagesRef.current, updateMessages, voice, speed, aiConfig, speechRunRef, ttsQueueRef,
          () => { if (conversationActiveRef.current) scheduleListening(); },
          () => setCallPhase('speaking'),
        );
      },
      () => {
        recognitionStartingRef.current = false;
        setListening(false);
        if (conversationActiveRef.current && callStateRef.current !== 'thinking') scheduleListening();
      },
    );
    recognitionRef.current = recognition;
    if (recognition) {
      recognitionStartingRef.current = true;
      setListening(true);
      setCallPhase('listening');
      recognition.start();
    }
  };

  const endConversation = () => {
    conversationActiveRef.current = false;
    speechRunRef.current += 1;
    voiceGateRef.current?.stop();
    recognitionRef.current?.stop();
    recognitionStartingRef.current = false;
    if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
    stopSpeaking();
    ttsQueueRef.current = Promise.resolve();
    setListening(false);
    setSpeaking(false);
    setCallPhase('idle');
    navigate('summary');
  };

  const startMode = (value: Mode) => {
    speechRunRef.current += 1;
    stopSpeaking();
    ttsQueueRef.current = Promise.resolve();
    setMode(value);
    setStyle(modeStyles[value][0]);
    if (value !== 'debate') setDebatePrompt('');
    navigate('setup', value);
  };

  const startListenSession = () => {
    stopSpeaking();
    ttsQueueRef.current = Promise.resolve();
    speechRunRef.current += 1;
    conversationActiveRef.current = true;
    navigate('call');
    void send(
      `Begin a short spoken introduction about ${topic || 'the selected topic'}.`,
      { ...settings, mode: 'listen', topic: topic || 'the selected topic' },
      [], updateMessages, voice, speed, aiConfig, speechRunRef, ttsQueueRef,
    );
  };

  const updateEmotion = (value: string) => {
    setEmotion(value);
    if (mode === 'vent') window.history.replaceState({ mode, emotion: value }, '', makePublicPath(contextPath(mode, value), basePath));
  };

  const reset = () => {
    conversationActiveRef.current = false;
    speechRunRef.current += 1;
    voiceGateRef.current?.stop();
    recognitionRef.current?.stop();
    navigate('welcome');
    messagesRef.current = []; setMessages([]); setElapsed(0); setTopic(''); setDebatePrompt('');
    setListening(false); setSpeaking(false);
    stopSpeaking();
    ttsQueueRef.current = Promise.resolve();
  };

  const talkAgain = () => {
    conversationActiveRef.current = false;
    speechRunRef.current += 1;
    voiceGateRef.current?.stop();
    recognitionRef.current?.stop();
    stopSpeaking();
    messagesRef.current = []; setMessages([]); setElapsed(0); setListening(false); setSpeaking(false);
    navigate('setup');
  };

  const toggleMute = () => {
    setMuted((value) => {
      const next = !value;
      if (next) {
        speechRunRef.current += 1;
        if (restartTimerRef.current) window.clearTimeout(restartTimerRef.current);
        ttsQueueRef.current = Promise.resolve();
        conversationActiveRef.current = false;
        voiceGateRef.current?.stop();
        recognitionRef.current?.stop();
        recognitionStartingRef.current = false;
        stopSpeaking();
        setListening(false); setSpeaking(false); setCallState('idle');
      }
      return next;
    });
  };

  const toggleVoice = () => {
    if (speaking) { stopSpeaking(); setSpeaking(false); }
    else if (messages[messages.length - 1]?.role === 'assistant') {
      speak(messages[messages.length - 1]?.content ?? '', { profile: voice, speed, tone: 'warm' });
      setSpeaking(true);
    }
  };

  const confirmLeave = (action: () => void) => { if (screen === 'call') setLeaveAction(() => action); else action(); };

  const openLegal = (doc: LegalDocument) => {
    setLegalDocument(doc);
    const path = doc === 'ai' ? '/ai-disclaimer' : `/${doc}`;
    if (window.location.pathname !== makePublicPath(path, basePath))
      window.history.replaceState({ legal: doc }, '', makePublicPath(path, basePath));
  };

  const closeLegal = () => {
    setLegalDocument(null);
    const path = normalizeAppPath(window.location.pathname, basePath);
    if (path === '/terms' || path === '/privacy' || path === '/ai-disclaimer')
      window.history.replaceState({}, '', makePublicPath('/', basePath));
  };

  const downloadTranscript = () => {
    if (!messages.length) return;
    const blob = new Blob([transcriptText(messagesRef.current)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hush-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <main className={`${dark ? 'app dark' : 'app'} ${screen !== 'welcome' ? `${mode}-theme` : ''} ${screen === 'setup' && mode === 'vent' ? `emotion-${emotion.toLowerCase()}` : ''}`}>
      <header className="topbar">
        <button className="brand" onClick={() => confirmLeave(reset)}>
          <span className="brand-mark"><Waves size={17} /></span>
          <span>hush companion<span className="brand-dot">.</span></span>
        </button>
        <div className="top-actions">
          <span className="availability"><span className="status-dot" /> Always here</span>
          <button className="site-link" type="button" onClick={() => setInfoPanel('docs')}>Docs</button>
          <button className="site-link" type="button" onClick={() => setInfoPanel('pricing')}>Pricing</button>
          <button className="site-link" type="button" onClick={() => setInfoPanel('contact')}>Contact us</button>
          <a className="site-link support-link" href="https://github.com/sponsors/devkdas" target="_blank" rel="noreferrer">Support the developer</a>
          <button className="voice-settings-button" type="button" onClick={() => setShowVoiceSettings(true)}>Voice</button>
          <button className="ai-settings-button" type="button" onClick={() => setShowAISettings(true)}>AI settings</button>
          <button className="icon-button" aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setDark((v) => { const next = !v; localStorage.setItem('hush-theme', next ? 'dark' : 'light'); return next; })}>
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {screen === 'welcome' && (
        <section className="welcome page-shell">
          <div className="welcome-copy">
            <div className="eyebrow">A LITTLE ROOM TO BREATHE</div>
            <h1>A voice that<br /><em>stays.</em></h1>
            <p className="hero-text">Talk it out. Think it through.<br />No judgment, no typing required.</p>
            <button className="primary-button large" onClick={() => navigate('mode')}>
              Start a conversation <ArrowRight size={18} />
            </button>
            <p className="microcopy"><ShieldCheck size={13} /> Your conversations stay private</p>
          </div>
          <div className="welcome-visual">
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <div className="welcome-orb"><Waves size={43} /></div>
            <div className="floating-note note-one"><Heart size={14} /> I'm listening</div>
            <div className="floating-note note-two"><Sparkles size={14} /> take your time</div>
          </div>
          <div className="feature-row">
            <Feature icon={<Mic size={18} />} tone="peach" title="Speak freely" text="Let it out without planning every word." />
            <Feature icon={<Heart size={18} />} tone="lavender" title="Feel understood" text="Hush Companion reflects what you share with care." />
            <Feature icon={<Lightbulb size={18} />} tone="mint" title="Take your time" text="Pause, continue, or change direction anytime." />
          </div>
        </section>
      )}

      {screen === 'mode' && (
        <section className="page-shell narrow">
          <div className="section-heading">
            <button className="back-button" onClick={() => confirmLeave(() => navigate('welcome'))}>
              <ArrowLeft size={15} /> Back
            </button>
            <div className="eyebrow">STEP 1 OF 3</div>
            <h2>What do you need<br /><em>right now?</em></h2>
            <p>You can always change direction later.</p>
          </div>
          <div className="mode-grid">
            <ModeCard mode="vent"    title="Let it out."              description="Say what you need to say. I'll listen, reflect, and be here with you." onClick={startMode} />
            <ModeCard mode="debate"  title="Make it sharper."         description="Practice an argument, test an idea, or prepare for a hard conversation." onClick={startMode} />
            <ModeCard mode="listen"  title="Let Hush Companion talk." description="Choose a topic and simply listen to a calm, engaging conversation." onClick={startMode} />
            <ModeCard mode="wellness" title="Reset and reflect."      description="Check in with yourself, ground your attention, or choose one healthy next step." onClick={startMode} />
          </div>
        </section>
      )}

      {screen === 'setup' && (
        <Setup
          mode={mode} emotion={emotion} style={style}
          topic={mode === 'debate' ? debatePrompt : topic}
          onEmotion={updateEmotion} onStyle={setStyle}
          onTopic={mode === 'debate' ? setDebatePrompt : setTopic}
          onBack={() => { speechRunRef.current += 1; navigate('mode'); setSpeaking(false); stopSpeaking(); ttsQueueRef.current = Promise.resolve(); }}
          onContinue={() => {
            if (mode === 'listen') {
              startListenSession();
              return;
            }
            const hasAIProvider = aiConfig.provider === 'ollama'
              ? Boolean(aiConfig.ollamaBaseUrl?.trim())
              : hasGeminiApiKey(aiConfig);
            if (!hasAIProvider) {
              setShowAISettings(true);
              return;
            }
            navigate('call');
          }}
        />
      )}

      {screen === 'call' && (
        <Call
          mode={mode} duration={duration} muted={muted} listening={listening}
          speaking={speaking} callState={callState} messages={messages}
          speechSupported={speechSupported}
          onMute={toggleMute} onListen={beginListening} onSpeak={toggleVoice}
          onEnd={() => confirmLeave(endConversation)}
        />
      )}

      {screen === 'summary' && (
        <section className="page-shell summary">
          {/* Curved arrow pointing to "Support the developer" nav link */}
          <div className="support-arrow-hint" aria-hidden="true">
            <span className="support-arrow-label">If this helped,<br />consider supporting ✨</span>
            <svg className="support-arrow-svg" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M 10 90 C 10 40, 60 20, 78 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                strokeDasharray="5 3"
              />
              {/* Arrowhead */}
              <path
                d="M 72 4 L 80 10 L 68 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="eyebrow">CONVERSATION COMPLETE · {duration}</div>
          <h2>{mode === 'listen' ? <>You made room<br /><em>to listen.</em></> : <>You showed up<br /><em>for yourself.</em></>}</h2>
          <p className="summary-intro">Thanks for spending this time with Hush Companion.</p>
          <div className="summary-actions">
            <button className="secondary-button" onClick={downloadTranscript} disabled={!messagesRef.current.length}>
              <FileText size={15} /> Download transcript
            </button>
            <button className="primary-button" onClick={() => confirmLeave(talkAgain)}>Talk again</button>
          </div>
        </section>
      )}

      {showVoiceSettings && <VoiceSettings voice={voice} speed={speed} onVoice={setVoice} onSpeed={setSpeed} onClose={() => setShowVoiceSettings(false)} />}
      {showAISettings && <AISettings config={aiConfig} onSave={(next) => { updateAIConfig(next); setShowAISettings(false); }} onClose={() => setShowAISettings(false)} />}

      <footer className="footer-note">
        <ShieldCheck size={14} /> Private by design · AI, not a therapist{' '}
        <button type="button" onClick={() => setInfoPanel('docs')}>Docs</button>
        <button type="button" onClick={() => setInfoPanel('pricing')}>Pricing</button>
        <button type="button" onClick={() => setInfoPanel('contact')}>Contact</button>
        <button type="button" onClick={() => openLegal('terms')}>Terms</button>
        <button type="button" onClick={() => openLegal('privacy')}>Privacy</button>
        <button type="button" onClick={() => openLegal('ai')}>AI disclaimer</button>
      </footer>

      {infoPanel    && <InfoModal  panel={infoPanel} onClose={() => setInfoPanel(null)} onContact={() => setInfoPanel('contact')} />}
      {legalDocument && <LegalModal document={legalDocument} onClose={closeLegal} />}
      {leaveAction  && <LeaveModal onCancel={() => setLeaveAction(null)} onConfirm={() => { const action = leaveAction; setLeaveAction(null); action?.(); }} />}
    </main>
  );
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
declare global { interface Window { __hushCompanionRoot?: Root; } }
const root = document.getElementById('root');
if (!root) throw new Error('Hush Companion could not find the root element.');
const reactRoot = window.__hushCompanionRoot ?? createRoot(root);
window.__hushCompanionRoot = reactRoot;
reactRoot.render(<StrictMode><App /></StrictMode>);
