import { useState } from 'react';
import { X } from 'lucide-react';
import { clearGeminiApiKey, geminiApiKeyIssue, hasGeminiApiKey, maskedApiKey, providerLabel } from '../ai-config';
import type { AIConfig } from '../ollama';

interface AISettingsProps {
  config: AIConfig;
  onSave: (config: AIConfig) => void;
  onClose: () => void;
}

export function AISettings({ config, onSave, onClose }: AISettingsProps) {
  const [draft, setDraft] = useState<AIConfig>(config);
  const clearKey = () => {
    const cleared = clearGeminiApiKey();
    setDraft(cleared);
    onSave(cleared);
  };
  const geminiConfigured = hasGeminiApiKey(draft);
  const geminiKeyIssue = geminiApiKeyIssue(draft.geminiApiKey);
  const canSave = draft.provider !== 'gemini' || !geminiKeyIssue;

  return (
    <div className="legal-overlay" role="presentation" onClick={onClose}>
      <section className="legal-modal ai-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ai-settings-title" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={(e) => { e.preventDefault(); onSave(draft); }}>
          <button type="button" className="legal-close" aria-label="Close AI settings" onClick={onClose}><X size={18} /></button>
          <div className="eyebrow">HUSH COMPANION · AI PROVIDER</div>
          <h2 id="ai-settings-title">Choose your <em>engine.</em></h2>
          <p>Use Google Gemini with your own key, or keep using a local Ollama server.</p>
          <label className="settings-field">
            <span>Provider</span>
            <select value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value as AIConfig['provider'] })}>
              <option value="gemini">{providerLabel('gemini')}</option>
              <option value="ollama">{providerLabel('ollama')}</option>
            </select>
          </label>
          {draft.provider === 'gemini' ? (
            <>
              <label className="settings-field">
                <span>Google AI API key</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={typeof draft.geminiApiKey === 'string' ? draft.geminiApiKey : ''}
                  onChange={(e) => setDraft({ ...draft, geminiApiKey: e.target.value })}
                  placeholder="Paste your Gemini API key"
                />
              </label>
              <label className="settings-field">
                <span>Gemini model</span>
                <input
                  value={draft.geminiModel ?? ''}
                  onChange={(e) => setDraft({ ...draft, geminiModel: e.target.value })}
                  placeholder="gemini-2.5-flash"
                />
              </label>
              <p className={geminiKeyIssue ? 'settings-note settings-warning' : 'settings-note'}>
                {geminiKeyIssue ?? (geminiConfigured
                  ? `Saved locally as ${maskedApiKey(draft.geminiApiKey)}.`
                  : 'No Gemini key is configured; Hush Companion will use the local fallback until you add one.'
                )}{' '}
                {!geminiKeyIssue && "Your key stays in this browser's local storage and is sent directly to Google."}
              </p>
              <button className="secondary-button" type="button" onClick={clearKey} disabled={!geminiConfigured}>
                Clear saved key
              </button>
            </>
          ) : (
            <>
              <label className="settings-field">
                <span>Ollama URL</span>
                <input value={draft.ollamaBaseUrl ?? ''} onChange={(e) => setDraft({ ...draft, ollamaBaseUrl: e.target.value })} placeholder="http://localhost:11434" />
              </label>
              <label className="settings-field">
                <span>Ollama model</span>
                <input value={draft.ollamaModel ?? ''} onChange={(e) => setDraft({ ...draft, ollamaModel: e.target.value })} placeholder="gemma3:4b" />
              </label>
              <p className="settings-note">Ollama runs locally by default. If you use the API proxy, set the URL to its address, such as http://localhost:3000.</p>
            </>
          )}
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit" disabled={!canSave}>Save settings</button>
          </div>
        </form>
      </section>
    </div>
  );
}

interface VoiceSettingsProps {
  voice: 'masculine' | 'feminine' | 'system';
  speed: 'slow' | 'natural' | 'fast';
  onVoice: (v: 'masculine' | 'feminine' | 'system') => void;
  onSpeed: (s: 'slow' | 'natural' | 'fast') => void;
  onClose: () => void;
}

export function VoiceSettings({ voice, speed, onVoice, onSpeed, onClose }: VoiceSettingsProps) {
  const voiceOptions = [
    { value: 'system' as const, label: 'System voice', description: "Use your device's default voice." },
    { value: 'feminine' as const, label: 'Feminine voice', description: 'A lighter pitch for a softer delivery.' },
    { value: 'masculine' as const, label: 'Masculine voice', description: 'A lower pitch for a steadier delivery.' },
  ];
  const speedOptions = [
    { value: 'slow' as const, label: 'Slow' },
    { value: 'natural' as const, label: 'Natural' },
    { value: 'fast' as const, label: 'Fast' },
  ];

  return (
    <div className="legal-overlay" role="presentation" onClick={onClose}>
      <section className="legal-modal voice-settings-modal" role="dialog" aria-modal="true" aria-labelledby="voice-settings-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="legal-close" aria-label="Close voice settings" onClick={onClose}><X size={18} /></button>
        <div className="eyebrow">HUSH COMPANION · VOICE</div>
        <h2 id="voice-settings-title">Choose your <em>voice.</em></h2>
        <p>Select how Hush Companion should sound when it speaks.</p>
        <div className="voice-options">
          {voiceOptions.map((option) => (
            <button type="button" key={option.value} className={voice === option.value ? 'voice-option selected' : 'voice-option'} aria-pressed={voice === option.value} onClick={() => onVoice(option.value)}>
              <span><strong>{option.label}</strong><small>{option.description}</small></span>
              <span className="choice-radio">{voice === option.value && <span />}</span>
            </button>
          ))}
        </div>
        <div className="voice-speed">
          <span className="settings-field-label">Speaking speed</span>
          <div className="speed-options">
            {speedOptions.map((option) => (
              <button type="button" key={option.value} className={speed === option.value ? 'speed-option selected' : 'speed-option'} aria-pressed={speed === option.value} onClick={() => onSpeed(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button className="primary-button full" type="button" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}
