// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
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

beforeEach(() => {
  // Reset localStorage between tests
  localStorage.clear();
  // Default to welcome screen (no path)
  window.location.pathname = '/';
  window.location.search = '';
});

describe('App', () => {
  // ── Welcome screen ──────────────────────────────────────────────────────────
  it('renders the welcome screen heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /a voice that/i })).toBeInTheDocument();
  });

  it('renders the "Start a conversation" CTA', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /start a conversation/i })).toBeInTheDocument();
  });

  it('shows the header brand', () => {
    render(<App />);
    expect(screen.getByText(/hush companion/i)).toBeInTheDocument();
  });

  // ── Navigation: welcome → mode ──────────────────────────────────────────────
  it('navigates to mode selection screen when CTA is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start a conversation/i }));
    expect(screen.getByRole('heading', { name: /what do you need/i })).toBeInTheDocument();
  });

  it('shows all four mode cards on the mode screen', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start a conversation/i }));
    expect(screen.getByText('VENT')).toBeInTheDocument();
    expect(screen.getByText('DEBATE')).toBeInTheDocument();
    expect(screen.getByText('LISTEN')).toBeInTheDocument();
    expect(screen.getByText('WELLNESS')).toBeInTheDocument();
  });

  // ── Mode → setup navigation ─────────────────────────────────────────────────
  it('navigates to setup screen when a mode card is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /start a conversation/i }));
    fireEvent.click(screen.getByRole('button', { name: /choose vent/i }));
    // Setup screen has a "Change mode" back button
    expect(screen.getByRole('button', { name: /change mode/i })).toBeInTheDocument();
  });

  // ── Header modals ───────────────────────────────────────────────────────────
  it('opens the Docs info panel when the Docs button is clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^docs$/i }));
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
    fireEvent.click(screen.getByRole('button', { name: /^terms$/i }));
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('opens the Privacy modal from the footer', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^privacy$/i }));
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('opens the AI Disclaimer modal from the footer', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^ai disclaimer$/i }));
    expect(screen.getByText('AI Disclaimer')).toBeInTheDocument();
  });

  // ── Theme toggle ────────────────────────────────────────────────────────────
  it('toggles dark mode when the theme button is clicked', () => {
    render(<App />);
    const toggle = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggle);
    expect(localStorage.getItem('hush-theme')).toBe('dark');
    // Button label should now say "Switch to light mode"
    expect(screen.getByRole('button', { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
