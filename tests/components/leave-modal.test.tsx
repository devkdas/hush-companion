// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeaveModal } from '../../src/components/LeaveModal';

describe('LeaveModal', () => {
  it('renders the confirmation dialog', () => {
    render(<LeaveModal onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Leave this conversation?')).toBeInTheDocument();
  });

  it('calls onCancel when "Stay here" is clicked', () => {
    const onCancel = vi.fn();
    render(<LeaveModal onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /stay here/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('calls onConfirm when "Leave conversation" is clicked', () => {
    const onConfirm = vi.fn();
    render(<LeaveModal onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /leave conversation/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape is pressed', () => {
    const onCancel = vi.fn();
    render(<LeaveModal onCancel={onCancel} onConfirm={vi.fn()} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not call onConfirm when Escape is pressed', () => {
    const onConfirm = vi.fn();
    render(<LeaveModal onCancel={vi.fn()} onConfirm={onConfirm} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
