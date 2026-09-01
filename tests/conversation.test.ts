import { describe, expect, it } from 'vitest';
import { emotionPrompt, localFallback, systemPrompt } from '../src/conversation';

describe('conversation rules', () => {
  it('uses the Hush Companion identity for every conversation mode', () => {
    const settings = [
      { mode: 'vent' as const, emotion: 'calm', responseStyle: 'Just listen' },
      { mode: 'debate' as const, emotion: 'calm', responseStyle: 'Balanced' },
      { mode: 'listen' as const, emotion: 'calm', responseStyle: 'Calm explanation', topic: 'space' },
      { mode: 'wellness' as const, emotion: 'calm', responseStyle: 'Mood check-in' },
    ];

    for (const setting of settings) {
      expect(systemPrompt(setting)).toContain('You are Hush Companion');
    }
  });

  it('creates a concise Vent prompt with emotion context', () => {
    const prompt = systemPrompt({ mode: 'vent', emotion: 'sad', responseStyle: 'Just listen' });
    expect(prompt).toContain('feel sad');
    expect(prompt).toContain('one or two short natural sentences');
  });

  it('creates a non-clinical Wellness prompt with practical support', () => {
    const prompt = systemPrompt({ mode: 'wellness', emotion: 'overwhelmed', responseStyle: 'Grounding exercise' });
    expect(prompt).toContain('wellness check-in companion');
    expect(prompt).toContain('grounding');
    expect(prompt).toContain('Never diagnose, treat, or assess a mental-health condition');
    expect(prompt).toContain('Never claim to be a therapist');
  });

  it('creates a Debate prompt with topic context', () => {
    const prompt = systemPrompt({ mode: 'debate', emotion: 'calm', responseStyle: 'Balanced', topic: 'remote work' });
    expect(prompt).toContain('remote work');
    expect(prompt).toContain('Challenge ideas');
  });

  it('adds private emotion guidance without exposing the implementation label', () => {
    const prompt = systemPrompt({ mode: 'vent', emotion: 'Sad', responseStyle: 'Just listen' });
    expect(prompt).toContain('Be gentle, patient, and validating');
    expect(prompt).toContain('Keep this emotional context internal');
  });

  it('returns guidance for known and unknown emotions', () => {
    expect(emotionPrompt('ANGRY')).toContain('Stay calm and nonjudgmental');
    expect(emotionPrompt('unknown')).toContain('Adapt your tone sensitively');
  });

  it('returns a wellness fallback with safe next-step choices', () => {
    const response = localFallback({ mode: 'wellness', emotion: 'calm', responseStyle: 'Workday reset' });
    expect(response).toContain('grounding exercise');
    expect(response).toContain('one small next step');
  });

  it('returns a useful offline fallback', () => {
    const response = localFallback({ mode: 'vent', emotion: 'Angry', responseStyle: 'Just listen' });
    expect(response).toContain('here with you');
  });

  it('returns a listen fallback referencing the topic', () => {
    const response = localFallback({ mode: 'listen', emotion: 'calm', responseStyle: 'Calm explanation', topic: 'the Roman Empire' });
    expect(response).toContain('the Roman Empire');
  });

  it('returns a listen fallback with generic topic when none provided', () => {
    const response = localFallback({ mode: 'listen', emotion: 'calm', responseStyle: 'Calm explanation' });
    expect(response).toContain('that topic');
  });

  it('returns a debate fallback with actionable framing', () => {
    const response = localFallback({ mode: 'debate', emotion: 'calm', responseStyle: 'Balanced' });
    expect(response).toContain('strongest point');
  });

  it('creates a Listen prompt with topic and style context', () => {
    const prompt = systemPrompt({ mode: 'listen', emotion: 'calm', responseStyle: 'Storytelling', topic: 'black holes', listenStyle: 'story' });
    expect(prompt).toContain('black holes');
    expect(prompt).toContain('story');
    expect(prompt).toContain('Do not ask the listener questions');
  });
});
