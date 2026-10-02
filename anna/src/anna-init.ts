/**
 * Anna App Runtime initialization.
 * Called once at app startup to signal the host iframe that the bundle is ready.
 * Falls back gracefully when running outside of Anna (e.g. local Vite dev).
 */
export function annaInit(): void {
  try {
    if (window.anna?.window?.ready) {
      window.anna.window.ready();
    }
  } catch {
    // Running outside Anna — fine
  }
}

/**
 * Set the Anna window title to reflect the current mode.
 */
export function annaSetTitle(title: string): void {
  try {
    if (window.anna?.window?.set_title) {
      window.anna.window.set_title(title);
    }
  } catch { /* ignore */ }
}
