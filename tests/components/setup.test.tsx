// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Setup } from '../../src/components/Setup';

const defaultProps = {
  mode: 'vent' as const,
  emotion: '',
  style: 'Just listen',
  topic: '',
  onEmotion: vi.fn(),
  onStyle: vi.fn(),
  onTopic: vi.fn(),
  onBack: vi.fn(),
  onContinue: vi.fn(),
};

describe('Setup', () => {
  // ─── Navigation ─────────────────────────────────────────────────────────────
  it('calls onBack when "Change mode" is clicked', () => {
    const onBack = vi.fn();
    render(<Setup {...defaultProps} onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /change mode/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  // ─── vent mode ───────────────────────────────────────────────────────────────
  it('shows emotion grid for vent mode', () => {
    render(<Setup {...defaultProps} mode="vent" />);
    // At least one emotion button should be present
    expect(screen.getByText(/sad/i)).toBeInTheDocument();
  });

  it('calls onContinue immediately for vent mode without topic', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="vent" topic="" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  // ─── wellness mode ───────────────────────────────────────────────────────────
  it('shows the wellness step header', () => {
    render(<Setup {...defaultProps} mode="wellness" style="Mood check-in" />);
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
  });

  it('calls onContinue immediately for wellness mode without topic', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="wellness" style="Mood check-in" topic="" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  // ─── listen mode ─────────────────────────────────────────────────────────────
  it('shows topic input for listen mode', () => {
    render(<Setup {...defaultProps} mode="listen" style="Calm explanation" />);
    expect(screen.getByPlaceholderText(/history of space/i)).toBeInTheDocument();
  });

  it('blocks onContinue for listen mode when topic is empty', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="listen" style="Calm explanation" topic="" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter a topic to talk about.')).toBeInTheDocument();
  });

  it('calls onContinue for listen mode when topic is provided', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="listen" style="Calm explanation" topic="Black holes" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  // ─── debate mode ─────────────────────────────────────────────────────────────
  it('shows topic input for debate mode', () => {
    render(<Setup {...defaultProps} mode="debate" style="Balanced" />);
    expect(screen.getByPlaceholderText(/ask for a promotion/i)).toBeInTheDocument();
  });

  it('blocks onContinue for debate mode when topic is empty', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="debate" style="Balanced" topic="" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter a topic to work through.')).toBeInTheDocument();
  });

  it('calls onContinue for debate mode when topic is provided', () => {
    const onContinue = vi.fn();
    render(<Setup {...defaultProps} mode="debate" style="Balanced" topic="Remote work" onContinue={onContinue} />);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('shows debate prompt chips', () => {
    render(<Setup {...defaultProps} mode="debate" style="Balanced" />);
    expect(screen.getByText(/or choose a starting point/i)).toBeInTheDocument();
  });

  // ─── Style choice list ───────────────────────────────────────────────────────
  it('calls onStyle when a style choice is clicked', () => {
    const onStyle = vi.fn();
    render(<Setup {...defaultProps} mode="vent" onStyle={onStyle} />);
    fireEvent.click(screen.getByText('Help me think it through'));
    expect(onStyle).toHaveBeenCalledWith('Help me think it through');
  });
});
