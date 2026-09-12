import { useEffect, useRef } from 'react';

export function LeaveModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<Element | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previousFocus.current instanceof HTMLElement) previousFocus.current.focus();
    };
  }, [onCancel]);

  return (
    <div className="legal-overlay" role="presentation">
      <section className="legal-modal leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <div className="eyebrow">ACTIVE CONVERSATION</div>
        <h2 id="leave-title">Leave this conversation?</h2>
        <p>You have an existing conversation in progress. Leaving now will clear this conversation.</p>
        <div className="leave-actions">
          <button ref={cancelRef} className="secondary-button" type="button" onClick={onCancel}>Stay here</button>
          <button className="primary-button" type="button" onClick={onConfirm}>Leave conversation</button>
        </div>
      </section>
    </div>
  );
}
