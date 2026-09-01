import { describe, expect, it } from 'vitest';
import { emotions, debatePrompts, modeStyles } from '../src/types';

describe('types — constants', () => {
  it('exports all 8 emotion labels', () => {
    expect(emotions).toHaveLength(8);
    expect(emotions).toContain('Sad');
    expect(emotions).toContain('Anxious');
    expect(emotions).toContain('Overwhelmed');
  });

  it('exports 4 debate prompt options', () => {
    expect(debatePrompts).toHaveLength(4);
    expect(debatePrompts.every((p) => typeof p === 'string' && p.length > 0)).toBe(true);
  });

  it('modeStyles contains entries for all four modes', () => {
    const modes = ['vent', 'debate', 'listen', 'wellness'] as const;
    for (const mode of modes) {
      expect(modeStyles[mode].length).toBeGreaterThan(0);
      expect(modeStyles[mode].every((s) => typeof s === 'string')).toBe(true);
    }
  });

  it('modeStyles vent has the expected style options', () => {
    expect(modeStyles.vent).toEqual(['Just listen', 'Help me feel understood', 'Help me think it through']);
  });

  it('modeStyles wellness has the most options', () => {
    const lengths = Object.values(modeStyles).map((s) => s.length);
    expect(modeStyles.wellness.length).toBe(Math.max(...lengths));
  });
});
