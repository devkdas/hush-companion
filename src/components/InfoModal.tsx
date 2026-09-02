import { ArrowRight, X } from 'lucide-react';
import type { InfoPanel } from '../types';

interface InfoModalProps {
  panel: InfoPanel;
  onClose: () => void;
  onContact: () => void;
}

const content = {
  docs: {
    eyebrow: 'HUSH COMPANION · DOCUMENTATION',
    title: <>Learn how Hush Companion <em>works.</em></>,
    body: 'Browse the Hush Companion documentation and the AI provider resources.',
    items: [
      { label: 'Hush Companion documentation', href: 'https://github.com/devkdas/hush-companion/tree/main/docs' },
      { label: 'Google Gemini documentation', href: 'https://ai.google.dev/gemini-api/docs' },
      { label: 'Ollama documentation', href: 'https://docs.ollama.com/' },
      { label: 'Google AI Studio', href: 'https://aistudio.google.com/app/apikey' },
    ],
  },
  pricing: {
    eyebrow: 'HUSH COMPANION · PRICING',
    title: <>Simple plans, <em>clear choices.</em></>,
    body: 'The GitHub version is free and open source. Optional developer services are available for people who want help with setup or customization.',
    items: [
      { label: 'GitHub open source', detail: 'Free · MIT licensed · Bring your own Gemini key or use Ollama' },
      { label: 'Setup and deployment help', detail: 'Optional · Contact the developer for an estimate' },
      { label: 'Custom development', detail: 'Discussed directly · Branding, integrations, or private setup' },
      { label: 'Developer support', detail: 'Optional · Support ongoing maintenance through GitHub Sponsors' },
    ],
  },
  contact: {
    eyebrow: 'HUSH COMPANION · CONTACT',
    title: <>Build something <em>with Hush Companion.</em></>,
    body: 'Questions, feedback, deployment requests, and partnership ideas are welcome.',
    items: [
      { label: 'Email:', linkLabel: 'hello.hushcompanion@gmail.com', href: 'mailto:hello.hushcompanion@gmail.com' },
      { label: 'Contact developer on GitHub', href: 'https://github.com/devkdas' },
    ],
  },
} satisfies Record<InfoPanel, { eyebrow: string; title: React.ReactNode; body: string; items: unknown[] }>;

export function InfoModal({ panel, onClose, onContact }: InfoModalProps) {
  const c = content[panel];
  return (
    <div className="legal-overlay" role="presentation" onClick={onClose}>
      <section className="legal-modal info-modal" role="dialog" aria-modal="true" aria-labelledby="info-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="legal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className="eyebrow">{c.eyebrow}</div>
        <h2 id="info-title">{c.title}</h2>
        {panel !== 'docs' && <p>{c.body}</p>}
        <div className="info-links">
          {(c.items as Record<string, string>[]).map((item) =>
            'linkLabel' in item ? (
              <div className="contact-email-row" key={item.label}>
                <span>{item.label}</span>
                <a href={item.href}>{item.linkLabel}</a>
                <ArrowRight size={15} />
              </div>
            ) : 'href' in item ? (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                {item.label}<ArrowRight size={15} />
              </a>
            ) : (
              <div className="info-plan" key={item.label}>
                <strong>{item.label}</strong>
                <span>{'detail' in item ? item.detail : ''}</span>
              </div>
            )
          )}
        </div>
        {panel === 'pricing' && (
          <>
            <p className="settings-note">
              Hush Companion is currently available through GitHub as a free open-source project.
              Optional services are discussed directly with the developer; this app does not collect payments.
            </p>
            <button className="primary-button contact-companion-button" type="button" onClick={() => { onClose(); onContact(); }}>
              Contact developer <ArrowRight size={15} />
            </button>
          </>
        )}
      </section>
    </div>
  );
}
