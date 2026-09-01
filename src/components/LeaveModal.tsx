export function LeaveModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="legal-overlay" role="presentation">
      <section className="legal-modal leave-modal" role="dialog" aria-modal="true" aria-labelledby="leave-title">
        <div className="eyebrow">ACTIVE CONVERSATION</div>
        <h2 id="leave-title">Leave this conversation?</h2>
        <p>You have an existing conversation in progress. Leaving now will clear this conversation.</p>
        <div className="leave-actions">
          <button className="secondary-button" type="button" onClick={onCancel}>Stay here</button>
          <button className="primary-button" type="button" onClick={onConfirm}>Leave conversation</button>
        </div>
      </section>
    </div>
  );
}
