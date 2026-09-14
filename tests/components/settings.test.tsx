// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceSettings, AISettings } from '../../src/components/Settings';
import type { AIConfig } from '../../src/ollama';

// ─── VoiceSettings ────────────────────────────────────────────────────────────
describe('VoiceSettings', () => {
  const defaults = { voice: 'system' as const, speed: 'natural' as const };

  it('renders all three voice options', () => {
    render(<VoiceSettings {...defaults} onVoice={vi.fn()} onSpeed={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('System voice')).toBeInTheDocument();
    expect(screen.getByText('Masculine voice')).toBeInTheDocument();
    expect(screen.getByText('Feminine voice')).toBeInTheDocument();
  });

  it('marks the current voice as selected (aria-pressed=true)', () => {
    render(<VoiceSettings {...defaults} voice="masculine" onVoice={vi.fn()} onSpeed={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /masculine/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /system/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onVoice when a voice option is clicked', () => {
    const onVoice = vi.fn();
    render(<VoiceSettings {...defaults} onVoice={onVoice} onSpeed={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /feminine/i }));
    expect(onVoice).toHaveBeenCalledWith('feminine');
  });

  it('renders all three speed options', () => {
    render(<VoiceSettings {...defaults} onVoice={vi.fn()} onSpeed={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^slow$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^natural$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^fast$/i })).toBeInTheDocument();
  });

  it('marks the current speed as selected (aria-pressed=true)', () => {
    render(<VoiceSettings {...defaults} speed="fast" onVoice={vi.fn()} onSpeed={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^fast$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSpeed when a speed option is clicked', () => {
    const onSpeed = vi.fn();
    render(<VoiceSettings {...defaults} onVoice={vi.fn()} onSpeed={onSpeed} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^slow$/i }));
    expect(onSpeed).toHaveBeenCalledWith('slow');
  });

  it('calls onClose when Done is clicked', () => {
    const onClose = vi.fn();
    render(<VoiceSettings {...defaults} onVoice={vi.fn()} onSpeed={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

// ─── AISettings ───────────────────────────────────────────────────────────────
describe('AISettings', () => {
  const ollamaConfig: AIConfig = { provider: 'ollama', ollamaBaseUrl: '', ollamaModel: '' };
  const geminiConfig: AIConfig = { provider: 'gemini', geminiApiKey: '' };

  it('renders provider selector', () => {
    render(<AISettings config={ollamaConfig} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('shows Ollama URL field when provider is ollama', () => {
    render(<AISettings config={ollamaConfig} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeInTheDocument();
  });

  it('shows Gemini API key field when provider is gemini', () => {
    render(<AISettings config={geminiConfig} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByPlaceholderText('Paste your Gemini API key')).toBeInTheDocument();
  });

  it('Save settings button is enabled for Ollama (no key required)', () => {
    render(<AISettings config={ollamaConfig} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save settings/i })).not.toBeDisabled();
  });

  it('calls onSave when form is submitted', () => {
    const onSave = vi.fn();
    render(<AISettings config={ollamaConfig} onSave={onSave} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /save settings/i }));
    expect(onSave).toHaveBeenCalledOnce();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(<AISettings config={ollamaConfig} onSave={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('Clear saved key button is disabled when no key is stored', () => {
    render(<AISettings config={geminiConfig} onSave={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /clear saved key/i })).toBeDisabled();
  });
});
