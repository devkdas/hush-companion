import { describe, expect, it } from 'vitest';
import { appPath, contextPath, modeFromPath, pathFor, publicPath, transcriptText } from '../src/app-helpers';

describe('app helpers', () => {
  it('normalizes paths under the GitHub Pages repository base', () => {
    const base = '/hush-companion';
    expect(appPath('/hush-companion/', base)).toBe('/');
    expect(appPath('/hush-companion/modes', base)).toBe('/modes');
    expect(appPath('/hush-companion/vent/sad', base)).toBe('/vent/sad');
    expect(publicPath('/', base)).toBe('/hush-companion');
    expect(publicPath('/modes', base)).toBe('/hush-companion/modes');
  });

  it('supports the local root base path', () => {
    expect(appPath('/modes', '')).toBe('/modes');
    expect(publicPath('/', '')).toBe('');
  });
  it('recognizes supported mode paths and rejects other paths', () => {
    expect(modeFromPath('/vent')).toBe('vent');
    expect(modeFromPath('/debate/setup')).toBe('debate');
    expect(modeFromPath('/listen')).toBe('listen');
    expect(modeFromPath('/wellness')).toBe('wellness');
    expect(modeFromPath('/')).toBeNull();
    expect(modeFromPath('/unknown')).toBeNull();
  });

  it('keeps mode URLs for non-home screens', () => {
    expect(pathFor('mode', 'vent')).toBe('/modes');
    expect(pathFor('setup', 'debate')).toBe('/debate');
    expect(pathFor('call', 'debate', 'A work decision')).toBe('/debate/a%20work%20decision');
    expect(pathFor('call', 'listen', 'Space exploration')).toBe('/listen/space%20exploration');
    expect(pathFor('call', 'listen')).toBe('/listen');
    expect(pathFor('setup', 'wellness', 'workday reset')).toBe('/wellness/workday%20reset');
  });

  it('builds emotion-specific mode paths', () => {
    expect(contextPath('vent', 'Sad')).toBe('/vent/sad');
    expect(contextPath('debate', 'A work decision')).toBe('/debate/a%20work%20decision');
    expect(contextPath('listen', 'Space exploration')).toBe('/listen/space%20exploration');
    expect(contextPath('wellness', 'Grounding exercise')).toBe('/wellness/grounding%20exercise');
  });

  it('formats transcripts locally without remote fields', () => {
    expect(transcriptText([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ])).toBe('Hush Companion conversation\n\nYou: Hello\n\nHush Companion: Hi there');
  });
});
