import { ChatMessage } from './conversation';

export type AppMode = 'vent' | 'debate' | 'listen' | 'wellness';
export type AppScreen = 'welcome' | 'mode' | 'setup' | 'call' | 'summary';

export function appPath(pathname: string, basePath: string): string {
  return pathname.startsWith(basePath) ? pathname.slice(basePath.length) || '/' : pathname;
}

export function publicPath(pathname: string, basePath: string): string {
  return `${basePath}${pathname === '/' ? '' : pathname}`;
}

export function modeFromPath(pathname: string): AppMode | null {
  const value = pathname.replace(/^\/+/, '').split('/')[0] as AppMode;
  return value === 'vent' || value === 'debate' || value === 'listen' || value === 'wellness' ? value : null;
}

export function contextPath(mode: AppMode, context: string): string {
  return `/${mode}/${encodeURIComponent(context.trim().toLowerCase())}`;
}

export function pathFor(screen: AppScreen, mode: AppMode, context?: string): string {
  if (screen === 'welcome') return '/';
  if (screen === 'mode') return '/modes';
  return context ? contextPath(mode, context) : `/${mode}`;
}


export function transcriptText(messages: ChatMessage[]): string {
  return `Hush Companion conversation\n\n${messages.map((message) => `${message.role === 'user' ? 'You' : 'Hush Companion'}: ${message.content}`).join('\n\n')}`;
}
