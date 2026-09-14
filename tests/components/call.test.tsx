// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Call } from '../../src/components/Call';
import type { ChatMessage } from '../../src/ollama';

const baseProps = {
  mode: 'vent' as const,
  duration: '0:42',
  muted: false,
  listening: false,
  speaking: false,
  callState: 'idle' as const,
  messages: [] as ChatMessage[],
  speechSupported: true,
  onMute: vi.fn(),
  onListen: vi.fn(),
  onSpeak: vi.fn(),
  onEnd: vi.fn(),
};

describe('Call', () => {
  // ─── State labels ─────────────────────────────────────────────────────────
  it('shows "Ready when you are" in idle state', () => {
    render(<Call {...baseProps} callState="idle" />);
    expect(screen.getByText('Ready when you are')).toBeInTheDocument();
  });

  it('shows "Listening to you" in listening state', () => {
    render(<Call {...baseProps} callState="listening" />);
    expect(screen.getByText('Listening to you')).toBeInTheDocument();
  });

  it('shows "Thinking…" in thinking state', () => {
    render(<Call {...baseProps} callState="thinking" />);
    expect(screen.getByText('Thinking…')).toBeInTheDocument();
  });

  it('shows "Hush Companion is speaking" in speaking state', () => {
    render(<Call {...baseProps} callState="speaking" />);
    expect(screen.getByText('Hush Companion is speaking')).toBeInTheDocument();
  });

  // ─── Mode and duration ────────────────────────────────────────────────────
  it('displays the mode label', () => {
    render(<Call {...baseProps} mode="debate" />);
    expect(screen.getByText('DEBATE MODE')).toBeInTheDocument();
  });

  it('displays the duration', () => {
    render(<Call {...baseProps} duration="2:15" />);
    expect(screen.getByText('2:15')).toBeInTheDocument();
  });

  // ─── Controls ────────────────────────────────────────────────────────────
  it('calls onEnd when end-call button is clicked', () => {
    const onEnd = vi.fn();
    render(<Call {...baseProps} onEnd={onEnd} />);
    // The end-call button has text content '■' and class 'end-call'
    const allButtons = screen.getAllByRole('button');
    const endBtn = allButtons.find((b) => b.classList.contains('end-call'))!;
    fireEvent.click(endBtn);
    expect(onEnd).toHaveBeenCalledOnce();
  });

  it('calls onMute when mute button is clicked', () => {
    const onMute = vi.fn();
    render(<Call {...baseProps} onMute={onMute} />);
    // Mute button shows "Mute" text span when unmuted
    const muteBtn = document.querySelector('.call-control') as HTMLElement;
    fireEvent.click(muteBtn);
    expect(onMute).toHaveBeenCalledOnce();
  });

  it('shows Unmute label when muted', () => {
    render(<Call {...baseProps} muted={true} />);
    expect(screen.getByText('Unmute')).toBeInTheDocument();
  });

  it('shows Mute label when not muted', () => {
    render(<Call {...baseProps} muted={false} />);
    expect(screen.getByText('Mute')).toBeInTheDocument();
  });

  it('calls onListen when the speak button is clicked', () => {
    const onListen = vi.fn();
    render(<Call {...baseProps} onListen={onListen} />);
    fireEvent.click(screen.getByRole('button', { name: /speak with hush companion/i }));
    expect(onListen).toHaveBeenCalledOnce();
  });

  it('disables speak button when muted', () => {
    render(<Call {...baseProps} muted={true} />);
    expect(screen.getByRole('button', { name: /speak with hush companion/i })).toBeDisabled();
  });

  // ─── Transcript ───────────────────────────────────────────────────────────
  it('hides transcript when no messages', () => {
    render(<Call {...baseProps} messages={[]} />);
    expect(document.querySelector('.transcript')).not.toBeInTheDocument();
  });

  it('renders transcript messages', () => {
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hello there' },
      { role: 'assistant', content: 'Hi, how are you?' },
    ];
    render(<Call {...baseProps} messages={messages} />);
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    expect(screen.getByText('Hi, how are you?')).toBeInTheDocument();
  });

  // ─── Speech not supported ────────────────────────────────────────────────
  it('shows browser warning when speechSupported is false', () => {
    render(<Call {...baseProps} speechSupported={false} />);
    expect(screen.getByText(/voice input is not supported/i)).toBeInTheDocument();
  });

  it('does not render speak button when speechSupported is false', () => {
    render(<Call {...baseProps} speechSupported={false} />);
    expect(screen.queryByRole('button', { name: /speak with hush companion/i })).not.toBeInTheDocument();
  });
});
