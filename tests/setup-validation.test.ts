import { describe, expect, it } from 'vitest';
import { validateSetupTopic } from '../src/components/Setup';
import { modeStyles } from '../src/types';

// ─── Topic validation ─────────────────────────────────────────────────────────
describe('validateSetupTopic', () => {
  // listen mode
  it('returns null for listen mode when topic is provided', () => {
    expect(validateSetupTopic('listen', 'The history of the internet')).toBeNull();
  });

  it('returns an error for listen mode when topic is empty', () => {
    expect(validateSetupTopic('listen', '')).toBe('Please enter a topic to talk about.');
  });

  it('returns an error for listen mode when topic is blank whitespace', () => {
    expect(validateSetupTopic('listen', '   ')).toBe('Please enter a topic to talk about.');
  });

  // debate mode
  it('returns null for debate mode when topic is provided', () => {
    expect(validateSetupTopic('debate', 'Should I ask for a promotion?')).toBeNull();
  });

  it('returns an error for debate mode when topic is empty', () => {
    expect(validateSetupTopic('debate', '')).toBe('Please enter a topic to work through.');
  });

  it('returns an error for debate mode when topic is blank whitespace', () => {
    expect(validateSetupTopic('debate', '   ')).toBe('Please enter a topic to work through.');
  });

  // vent and wellness never require a topic
  it('returns null for vent mode regardless of topic', () => {
    expect(validateSetupTopic('vent', '')).toBeNull();
    expect(validateSetupTopic('vent', 'anything')).toBeNull();
  });

  it('returns null for wellness mode regardless of topic', () => {
    expect(validateSetupTopic('wellness', '')).toBeNull();
    expect(validateSetupTopic('wellness', 'anything')).toBeNull();
  });
});

// ─── modeStyles completeness ──────────────────────────────────────────────────
// Ensures every mode has at least one style option (protects against accidental deletion).
describe('modeStyles', () => {
  it('has at least one style for every mode', () => {
    const modes = ['vent', 'debate', 'listen', 'wellness'] as const;
    for (const mode of modes) {
      expect(modeStyles[mode].length, `${mode} has no styles`).toBeGreaterThan(0);
    }
  });

  it('all styles for vent mode are non-empty strings', () => {
    for (const style of modeStyles['vent']) {
      expect(typeof style).toBe('string');
      expect(style.trim().length).toBeGreaterThan(0);
    }
  });

  it('all styles for debate mode are non-empty strings', () => {
    for (const style of modeStyles['debate']) {
      expect(typeof style).toBe('string');
      expect(style.trim().length).toBeGreaterThan(0);
    }
  });

  it('all styles for listen mode are non-empty strings', () => {
    for (const style of modeStyles['listen']) {
      expect(typeof style).toBe('string');
      expect(style.trim().length).toBeGreaterThan(0);
    }
  });

  it('all styles for wellness mode are non-empty strings', () => {
    for (const style of modeStyles['wellness']) {
      expect(typeof style).toBe('string');
      expect(style.trim().length).toBeGreaterThan(0);
    }
  });
});
