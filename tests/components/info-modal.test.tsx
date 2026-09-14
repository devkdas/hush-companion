// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InfoModal } from '../../src/components/InfoModal';

describe('InfoModal', () => {
  it('renders the docs panel', () => {
    render(<InfoModal panel="docs" onClose={vi.fn()} onContact={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/learn how hush companion/i)).toBeInTheDocument();
  });

  it('renders the pricing panel', () => {
    render(<InfoModal panel="pricing" onClose={vi.fn()} onContact={vi.fn()} />);
    expect(screen.getByText(/simple plans/i)).toBeInTheDocument();
    expect(screen.getByText('GitHub open source')).toBeInTheDocument();
  });

  it('renders the contact panel', () => {
    render(<InfoModal panel="contact" onClose={vi.fn()} onContact={vi.fn()} />);
    expect(screen.getByText(/build something/i)).toBeInTheDocument();
    expect(screen.getByText('hello.hushcompanion@gmail.com')).toBeInTheDocument();
  });

  it('calls onClose when X button is clicked', () => {
    const onClose = vi.fn();
    render(<InfoModal panel="docs" onClose={onClose} onContact={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<InfoModal panel="docs" onClose={onClose} onContact={vi.fn()} />);
    fireEvent.click(screen.getByRole('presentation'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when clicking inside the dialog', () => {
    const onClose = vi.fn();
    render(<InfoModal panel="docs" onClose={onClose} onContact={vi.fn()} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose and onContact when "Contact developer" is clicked on pricing panel', () => {
    const onClose = vi.fn();
    const onContact = vi.fn();
    render(<InfoModal panel="pricing" onClose={onClose} onContact={onContact} />);
    fireEvent.click(screen.getByRole('button', { name: /contact developer/i }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onContact).toHaveBeenCalledOnce();
  });

  it('renders documentation links on docs panel', () => {
    render(<InfoModal panel="docs" onClose={vi.fn()} onContact={vi.fn()} />);
    expect(screen.getByText('Hush Companion documentation')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini documentation')).toBeInTheDocument();
  });
});
