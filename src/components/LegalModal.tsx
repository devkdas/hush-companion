import { X } from 'lucide-react';
import type { LegalDocument } from '../types';

interface LegalModalProps {
  document: LegalDocument;
  onClose: () => void;
}

const legalContent = {
  terms: {
    title: 'Terms of Service',
    sections: [
      ['Acceptance', 'By using Hush Companion, you agree to these terms. Hush Companion is a free, open-source voice companion application provided as-is. It may change, be updated, or become unavailable at any time without notice.'],
      ['Eligibility and responsibility', 'You are responsible for using Hush Companion lawfully, keeping your device secure, and verifying any information before acting on it. Do not use Hush Companion for emergencies, medical decisions, or legal matters.'],
      ['Acceptable use', 'Do not use Hush Companion to threaten, harass, abuse, or impersonate others, violate any person\'s privacy, or attempt to disrupt or exploit the service.'],
      ['AI and safety limits', 'Hush Companion is an AI tool, not a human, therapist, doctor, lawyer, or emergency service. AI responses may be incomplete, inaccurate, or unsuitable for your situation. In any emergency, contact your local emergency services or a trusted person immediately.'],
      ['Voice and downloads', 'Microphone access is requested only when you actively choose to speak. Conversation transcripts are generated entirely within your browser and are never uploaded by Hush Companion. You are responsible for securing any files you download.'],
      ['AI provider processing', 'When you select Google Gemini, your message text is sent directly from your browser to Google\'s API using the key you provide. When you select Ollama, messages go to the Ollama server URL you configure. Hush Companion does not route, store, or log these messages. Review your chosen provider\'s privacy policy before sharing sensitive information.'],
      ['Intellectual property', 'The Hush Companion name, interface, and branding are owned by the project author. The source code is licensed under the MIT License. You retain full responsibility for content you submit and any files you download.'],
      ['Disclaimer of liability', 'Hush Companion is provided without warranty of any kind. To the fullest extent permitted by law, the project author is not liable for any direct, indirect, incidental, or consequential damages arising from your use of or inability to use this service.'],
      ['Changes and contact', 'These terms may be updated at any time. Continued use of Hush Companion constitutes acceptance of the updated terms. For questions, contact hello.hushcompanion@gmail.com.'],
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      ['What we collect', 'Hush Companion does not collect, store, or transmit any personal data to its own servers. There is no account system, analytics pipeline, or backend database associated with this application.'],
      ['What stays in your browser', 'Conversation messages are held in your browser\'s memory for the duration of your session and are lost when you close or refresh the page. Your theme preference is saved to browser localStorage on your device only.'],
      ['Microphone and speech', 'Microphone access is requested only after you press the speak button. Speech recognition and text-to-speech are handled by your browser and operating system. Hush Companion does not record, store, or transmit audio.'],
      ['AI provider data', 'If you configure Google Gemini, your typed or transcribed messages are sent from your browser directly to Google\'s API. If you configure Ollama, messages are sent to the server URL you provide. Each provider handles data according to its own policies—review them before sharing sensitive information.'],
      ['Transcript downloads', 'Downloaded transcript files are saved to your local device by your browser. Hush Companion has no access to files after download. You are solely responsible for managing, sharing, or deleting those files.'],
      ['Your choices', 'You can deny microphone permission at any time, choose not to configure an AI provider, clear your browser\'s localStorage, delete any downloaded files, or stop using Hush Companion entirely.'],
      ['Contact', 'For privacy questions or concerns, contact hello.hushcompanion@gmail.com.'],
    ],
  },
  ai: {
    title: 'AI Disclaimer',
    sections: [
      ['What Hush Companion is', 'Hush Companion is an AI-powered voice companion application. It is not a human, therapist, doctor, lawyer, financial advisor, or emergency service.'],
      ['Accuracy and reliability', 'AI-generated responses can be wrong, incomplete, biased, outdated, or inappropriate for your situation. Treat every response as a starting point for your own thinking, not as verified advice or fact.'],
      ['Health and crisis safety', 'Do not use Hush Companion for medical diagnosis, mental health treatment, crisis intervention, or emergency assistance. If you are in immediate danger or experiencing a mental health crisis, contact your local emergency services or a trusted person now.'],
      ['Privacy and sensitive information', 'Avoid sharing passwords, financial data, full names, identification numbers, or other sensitive personal information. Your configured AI provider receives the text of your conversations.'],
      ['Human judgment', 'Always verify important information with qualified professionals. Use your own judgment before making decisions based on anything Hush Companion says.'],
    ],
  },
} satisfies Record<LegalDocument, { title: string; sections: [string, string][] }>;

export function LegalModal({ document, onClose }: LegalModalProps) {
  const content = legalContent[document];
  return (
    <div className="legal-overlay" role="presentation" onClick={onClose}>
      <section className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="legal-close" aria-label="Close" onClick={onClose}><X size={18} /></button>
        <div className="eyebrow">HUSH COMPANION · INFORMATION</div>
        <h2 id="legal-title">{content.title}</h2>
        <div className="legal-sections">
          {content.sections.map(([heading, paragraph]) => (
            <div key={heading}>
              <h3>{heading}</h3>
              <p>{paragraph}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
