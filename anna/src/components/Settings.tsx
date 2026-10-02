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
    clearGeminiApiKey();
    const updated = { ...draft };
    delete updated.geminiApiKey;
    setDraft(updated);
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
          <p>Use Anna's built-in AI (included with your Anna account), or bring your own Google Gemini key for direct access.</p>
          <label className="settings-field">
            <span>Provider</span>
            <select value={draft.provider} onChange={(e) => setDraft({ ...draft, provider: e.target.value as AIConfig['provider'] })}>
              <option value="anna">{providerLabel('anna')}</option>
              <option value="gemini">{providerLabel('gemini')}</option>
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
                  ? `Saved as ${maskedApiKey(draft.geminiApiKey)}.`
                  : 'No Gemini key configured — will fall back to Anna AI.'
                )}{' '}
                {!geminiKeyIssue && "Your key is stored in Anna's secure storage and sent directly to Google."}
              </p>
              <button className="secondary-button" type="button" onClick={clearKey} disabled={!geminiConfigured}>
                Clear saved key
              </button>
            </>
          ) : (
            <>
              <p className="settings-note">
                Anna AI uses your Anna account's built-in LLM. No extra API key needed.
                Usage is billed to your Anna credits. Switching to Gemini lets you use Google's API directly with your own key.
              </p>
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
  const [draftSpeed, setDraftSpeed] = useState(speed);
  const [draftProfile, setDraftProfile] = useState(voice);

  return (
    <div className="legal-overlay" role="presentation" onClick={onClose}>
      <section className="legal-modal ai-settings-modal" role="dialog" aria-modal="true" aria-labelledby="voice-settings-title" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={(e) => { e.preventDefault(); onVoice(draftProfile); onSpeed(draftSpeed); onClose(); }}>
          <button type="button" className="legal-close" aria-label="Close voice settings" onClick={onClose}><X size={18} /></button>
          <div className="eyebrow">HUSH COMPANION · VOICE SETTINGS</div>
          <h2 id="voice-settings-title">Adjust your <em>voice.</em></h2>
          <label className="settings-field">
            <span>Speech speed</span>
            <select value={draftSpeed} onChange={(e) => setDraftSpeed(e.target.value as typeof draftSpeed)}>
              <option value="slow">Slow</option>
              <option value="natural">Natural</option>
              <option value="fast">Fast</option>
            </select>
          </label>
          <label className="settings-field">
            <span>Voice character</span>
            <select value={draftProfile} onChange={(e) => setDraftProfile(e.target.value as typeof draftProfile)}>
              <option value="system">System default</option>
              <option value="feminine">Feminine</option>
              <option value="masculine">Masculine</option>
            </select>
          </label>
          <p className="settings-note">Voice uses your device's built-in speech synthesis.</p>
          <div className="settings-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit">Save settings</button>
          </div>
        </form>
      </section>
    </div>
  );
}

// Re-export with the legacy prop names that main.tsx uses
export { VoiceSettings as _VoiceSettingsNew };
