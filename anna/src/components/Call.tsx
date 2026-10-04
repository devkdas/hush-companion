import { useRef, useState } from 'react';
import { Mic, MicOff, Repeat2, Send, Waves, Zap } from 'lucide-react';
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
  onTextSend?: (text: string) => void;
}

export function Call({
  mode, duration, muted, listening, speaking, callState, messages,
  speechSupported, onMute, onListen, onSpeak, onEnd, onTextSend,
}: CallProps) {
  const [textInput, setTextInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const stateLabel =
    callState === 'listening' ? 'Listening to you' :
    callState === 'thinking'  ? 'Thinking…' :
    callState === 'speaking'  ? 'Hush Companion is speaking' :
                                'Ready when you are';

  const submitText = () => {
    const val = textInput.trim();
    if (!val || !onTextSend) return;
    setTextInput('');
    onTextSend(val);
  };

  // Anna iframe blocks microphone via Permissions-Policy header.
  // Show text fallback instead of broken "Listening…" state.
  const micBlocked = !speechSupported;

  return (
    <section className="call-screen">
      <div className="call-top">
        <span>{mode.toUpperCase()} MODE</span>
        <span>{duration}</span>
      </div>
      <div className="call-center">
        <div className={speaking ? 'voice-orb speaking' : listening ? 'voice-orb listening' : 'voice-orb'}>
          <div className="orb-core"><Waves size={38} /></div>
        </div>
        <div className="call-state">{stateLabel}</div>
        {messages.length > 0 && (
          <div className="transcript">
            {messages.map((msg, i) => (
              <p key={`${msg.role}-${i}`}>
                <b>{msg.role === 'user' ? 'You:' : 'Hush Companion:'}</b>{msg.content}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="call-controls">
        <button type="button" className={muted ? 'call-control active' : 'call-control'} onClick={onMute}>
          {muted ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{muted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button type="button" className="end-call" onClick={onEnd}>■</button>
        <button type="button" className="call-control" onClick={onSpeak}>
          <Repeat2 size={20} />
          <span>{speaking ? 'Stop' : 'Repeat'}</span>
        </button>
      </div>

      {micBlocked ? (
        /* ── Text fallback when mic is blocked (e.g. Anna iframe) ── */
        <div className="text-input-fallback">
          <div className="text-input-row">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submitText(); }}
              placeholder="Type your message…"
              disabled={callState === 'thinking'}
              className="text-message-input"
            />
            <button
              type="button"
              className="primary-button send-btn"
              onClick={submitText}
              disabled={!textInput.trim() || callState === 'thinking'}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="interrupt-note">
            <Zap size={13} /> Voice input unavailable in this window — type your message above
          </p>
        </div>
      ) : (
        <>
          <button
            className="primary-button mic-action"
            onClick={onListen}
            disabled={muted || listening}
          >
            {listening ? 'Listening…' : speaking ? 'Interrupt and speak' : 'Speak with Hush Companion'}
          </button>
          <p className="interrupt-note"><Zap size={13} /> You can interrupt anytime</p>
        </>
      )}
    </section>
  );
}
