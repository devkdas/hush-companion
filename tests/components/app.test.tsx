// @vitest-environment jsdom
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// createVoiceGate calls AudioContext / getUserMedia — stub both
vi.mock('../../src/voice', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/voice')>();
  return {
    ...actual,
    createVoiceGate: vi.fn(() => ({ start: vi.fn().mockResolvedValue(false), stop: vi.fn() })),
    isSpeechRecognitionSupported: vi.fn(() => false),
    stopSpeaking: vi.fn(),
  };
});

// streamAI should never actually call a real server in tests
vi.mock('../../src/ollama', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/ollama')>();
  return {
    ...actual,
    streamAI: vi.fn(async function* () { /* yields nothing */ }),
  };
});

// Import App after mocks are in place
import App from '../../src/main';

describe('App', () => {
  beforeEach(() => {
    // Reset URL between tests — App reads window.location.pathname on mount
    // and pushState calls in previous tests would otherwise pollute renders.
    window.history.replaceState({}, '', '/');
  });

  // ── Welcome screen ──────────────────────────────────────────────────────────
  it('renders the welcome screen heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /a voice that/i })).toBeInTheDocument();
  });

  it('renders the "Start a conversation" CTA', () => {
    render(<App />);
    // The button contains an arrow icon — use partial text match via getByText
    expect(screen.getByText(/start a conversation/i)).toBeInTheDocument();
  });

  it('shows the brand in the header topbar', () => {
    render(<App />);
    const header = document.querySelector('.topbar')!;
    expect(within(header as HTMLElement).getByText(/hush companion/i)).toBeInTheDocument();
  });

  // ── Navigation: welcome → mode ──────────────────────────────────────────────
  it('navigates to mode selection screen when CTA is clicked', () => {
    render(<App />);
    const ctaBtn = screen.getAllByRole('button').find((b) => /start a conversation/i.test(b.textContent ?? ''))!;
    fireEvent.click(ctaBtn);
    expect(screen.getByRole('heading', { name: /what do you need/i })).toBeInTheDocument();
  });

  it('welcome screen shows all three feature cards', () => {
    render(<App />);
    expect(screen.getByText('Speak freely')).toBeInTheDocument();
    expect(screen.getByText('Feel understood')).toBeInTheDocument();
    // 'Take your time' appears in both the hero text and the feature card
    expect(screen.getAllByText(/take your time/i).length).toBeGreaterThanOrEqual(1);
  });

  // ── Mode → setup navigation ─────────────────────────────────────────────────
  it('navigates to setup screen when a mode card is clicked', () => {
    render(<App />);
    // Navigate to mode screen first
    const ctaBtn = screen.getAllByRole('button').find((b) => /start a conversation/i.test(b.textContent ?? ''))!;
    fireEvent.click(ctaBtn);
    fireEvent.click(screen.getByRole('button', { name: /choose vent/i }));
    expect(screen.getByRole('button', { name: /change mode/i })).toBeInTheDocument();
  });

  // ── Header modals ───────────────────────────────────────────────────────────
  it('opens the Docs info panel when the header Docs button is clicked', () => {
    render(<App />);
    // Use the header-specific Docs button (not the footer one)
    const header = document.querySelector('.topbar')!;
    fireEvent.click(within(header as HTMLElement).getByRole('button', { name: /^docs$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/hush companion documentation/i)).toBeInTheDocument();
  });

  it('opens AI settings when "AI settings" is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /ai settings/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/choose your/i)).toBeInTheDocument();
  });

  it('opens Voice settings when "Voice" is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^voice$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/system voice/i)).toBeInTheDocument();
  });

  // ── Footer legal links ──────────────────────────────────────────────────────
  it('opens the Terms modal from the footer', () => {
    render(<App />);
    const footer = document.querySelector('.footer-note')!;
    fireEvent.click(within(footer as HTMLElement).getByRole('button', { name: /^terms$/i }));
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('opens the Privacy modal from the footer', () => {
    render(<App />);
    const footer = document.querySelector('.footer-note')!;
    fireEvent.click(within(footer as HTMLElement).getByRole('button', { name: /^privacy$/i }));
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('opens the AI Disclaimer modal from the footer', () => {
    render(<App />);
    const footer = document.querySelector('.footer-note')!;
    fireEvent.click(within(footer as HTMLElement).getByRole('button', { name: /^ai disclaimer$/i }));
    expect(screen.getByText('AI Disclaimer')).toBeInTheDocument();
  });

  // ── Theme toggle ────────────────────────────────────────────────────────────
  it('toggles dark mode when the theme button is clicked', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
