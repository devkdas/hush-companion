// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LegalModal } from '../../src/components/LegalModal';

describe('LegalModal', () => {
  it('renders the Terms of Service heading', () => {
    render(<LegalModal document="terms" onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Terms of Service')).toBeInTheDocument();
  });

  it('renders the Privacy Policy heading', () => {
    render(<LegalModal document="privacy" onClose={vi.fn()} />);
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  it('renders the AI Disclaimer heading', () => {
    render(<LegalModal document="ai" onClose={vi.fn()} />);
    expect(screen.getByText('AI Disclaimer')).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', () => {
    const onClose = vi.fn();
    render(<LegalModal document="terms" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<LegalModal document="terms" onClose={onClose} />);
    fireEvent.keyDown(window.document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the overlay backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<LegalModal document="privacy" onClose={onClose} />);
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the dialog', () => {
    const onClose = vi.fn();
    render(<LegalModal document="terms" onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders all Terms section headings', () => {
    render(<LegalModal document="terms" onClose={vi.fn()} />);
    expect(screen.getByText('Acceptance')).toBeInTheDocument();
    expect(screen.getByText('Disclaimer of liability')).toBeInTheDocument();
  });

  it('renders all Privacy section headings', () => {
    render(<LegalModal document="privacy" onClose={vi.fn()} />);
    expect(screen.getByText('What we collect')).toBeInTheDocument();
    expect(screen.getByText('Your choices')).toBeInTheDocument();
  });

  it('renders all AI Disclaimer section headings', () => {
    render(<LegalModal document="ai" onClose={vi.fn()} />);
    expect(screen.getByText('What Hush Companion is')).toBeInTheDocument();
    expect(screen.getByText('Human judgment')).toBeInTheDocument();
  });
});
