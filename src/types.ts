import type { AppMode } from './app-helpers';
import type { ChatMessage } from './ollama';

export type Mode = AppMode;
export type Screen = 'welcome' | 'mode' | 'setup' | 'call' | 'summary';
export type VoiceProfile = 'masculine' | 'feminine' | 'system';
export type LegalDocument = 'terms' | 'privacy' | 'ai';
export type InfoPanel = 'docs' | 'pricing' | 'contact';
export type CallPhase = 'idle' | 'listening' | 'thinking' | 'speaking';
export type LeaveAction = (() => void) | null;

export type { ChatMessage };

export const emotions = ['Sad', 'Angry', 'Anxious', 'Lonely', 'Frustrated', 'Overwhelmed', 'Calm', 'Excited'];
export const debatePrompts = ['A work decision', 'A difficult conversation', 'An idea I want tested', 'A position I need to defend'];
export const modeStyles: Record<Mode, string[]> = {
  vent: ['Just listen', 'Help me feel understood', 'Help me think it through'],
  debate: ['Gentle', 'Balanced', 'Challenging'],
  listen: ['Calm explanation', 'Storytelling', 'News-style overview', 'Two sides'],
  wellness: ['Mood check-in', 'Grounding exercise', 'Workday reset', 'Reflect and journal', 'Prepare for a conversation'],
};
