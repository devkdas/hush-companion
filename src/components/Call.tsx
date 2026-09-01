import { Mic, MicOff, Repeat2, Waves, Zap } from 'lucide-react';
import type { CallPhase, ChatMessage, Mode } from '../types';

interface CallProps {
  mode: Mode;
  duration: string;
  muted: boolean;
  listening: boolean;
  speaking: boolean;
  callState: CallPhase;
  messages: ChatMessage[];
  speechSupported: boolean;
  onMute: () => void;
  onListen: () => void;
  onSpeak: () => void;
  onEnd: () => void;
}

export function Call({ mode, duration, muted, listening, speaking, callState, messages, speechSupported, onMute, onListen, onSpeak, onEnd }: CallProps) {
  const stateLabel =
    callState === 'listening' ? 'Listening to you' :
    callState === 'thinking'  ? 'Thinking…' :
    callState === 'speaking'  ? 'Hush Companion is speaking' :
                                'Ready when you are';

  return (
    <section className="call-screen">
      <div className="call-top">
        <span>{mode.toUpperCase()} MODE</span>
        <span>{duration}</span>
      </div>
      <div className="call-center">
        <div className={speaking ? 'voice-orb speaking' : 'voice-orb'}>
          <div className="orb-core"><Waves size={38} /></div>
        </div>
        <div className="call-state">{stateLabel}</div>
        {messages.length > 0 && (
          <div className="transcript">
            {messages.slice(-2).map((msg, i) => (
              <p key={`${msg.role}-${i}`}>
                <b>{msg.role === 'user' ? 'You:' : 'Hush Companion:'}</b>{msg.content}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="call-controls">
        <button className={muted ? 'call-control active' : 'call-control'} onClick={onMute}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button className="end-call" onClick={onEnd}>■</button>
        <button className="call-control" onClick={onSpeak}>
          <Repeat2 size={20} />
          <span>{speaking ? 'Stop' : 'Repeat'}</span>
        </button>
      </div>
      {!speechSupported ? (
        <p className="interrupt-note" style={{ color: 'var(--color-warn,#c0392b)' }}>
          ⚠ Voice input is not supported in this browser. Try Chrome or Edge.
        </p>
      ) : (
        <>
          <button className="primary-button mic-action" onClick={onListen} disabled={muted}>
            {listening ? 'Listening…' : speaking ? 'Interrupt and speak' : 'Speak with Hush Companion'}
          </button>
          <p className="interrupt-note"><Zap size={13} /> You can interrupt anytime</p>
        </>
      )}
    </section>
  );
}
