import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { Mode } from '../types';
import { debatePrompts, emotions, modeStyles } from '../types';

interface SetupProps {
  mode: Mode;
  emotion: string;
  style: string;
  topic: string;
  onEmotion: (value: string) => void;
  onStyle: (value: string) => void;
  onTopic: (value: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Setup({ mode, emotion, style, topic, onEmotion, onStyle, onTopic, onBack, onContinue }: SetupProps) {
  const heading =
    mode === 'listen' ? (<>What should I<br /><em>talk about?</em></>) :
    mode === 'vent'   ? (<>What's weighing<br /><em>on you?</em></>) :
    mode === 'wellness' ? (<>How do you want to<br /><em>feel today?</em></>) :
                          (<>What are you<br /><em>testing?</em></>);

  const description =
    mode === 'listen'   ? 'Pick a topic and simply listen.' :
    mode === 'vent'     ? 'Choose how you want Hush Companion to support you while you let it out.' :
    mode === 'wellness' ? 'Choose a gentle starting point for an everyday wellness check-in.' :
                          'Choose the idea, decision, or conversation you want to test.';

  const isTopicMode = mode === 'listen' || mode === 'debate';
  const styleDescriptions: Record<Mode, Record<string, string>> = {
    vent: {
      'Just listen': 'A safe space to vent, with no advice given.',
      'Help me think it through': 'Collaborative problem-solving and gentle nudges.',
      'Help me feel understood': "Empathy and validation for what you're going through.",
    },
    debate: {
      'Challenge my thinking': 'Test assumptions and expose weak points respectfully.',
      'Help me prepare': 'Practice clear responses for the conversation ahead.',
      'Keep it balanced': 'Explore both sides without pushing you toward one answer.',
    },
    listen: {
      'A short story': 'A focused narrative with a calm beginning and end.',
      'A curious conversation': 'An open-ended exchange full of thoughtful questions.',
      'A guided reflection': 'A gentle prompt to help you slow down and notice what matters.',
    },
    wellness: {
      'Ground me': 'Simple sensory prompts to help you reconnect with the present.',
      'Help me reflect': 'Thoughtful questions to notice patterns and possibilities.',
      'Give me one next step': 'A small, practical action you can take today.',
    },
  };

  return (
    <section className="page-shell narrow">
      <button className="back-button" onClick={onBack}><ArrowLeft size={15} /> Change mode</button>
      <div className="section-heading">
        <div className="eyebrow">{mode === 'wellness' ? 'STEP 1 OF 3 · CHECK-IN' : `STEP 2 OF 3 · ${mode.toUpperCase()}`}</div>
        <h2>{heading}</h2>
        <p>{description}</p>
      </div>
      {isTopicMode ? (
        <>
          <label className="topic-field">
            <span>{mode === 'debate' ? 'What should we work through?' : 'Topic'}</span>
            <input
              value={topic}
              onChange={(e) => onTopic(e.target.value)}
              placeholder={mode === 'debate' ? 'Should I ask for a promotion?' : 'The history of space exploration'}
            />
          </label>
          {mode === 'debate' && (
            <div className="prompt-list">
              <span className="prompt-label">Or choose a starting point</span>
              {debatePrompts.map((prompt) => (
                <button
                  type="button"
                  key={prompt}
                  className={topic === prompt ? 'prompt-chip selected' : 'prompt-chip'}
                  onClick={() => onTopic(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="emotion-grid">
          {emotions.map((item) => (
            <button key={item} className={emotion === item ? 'emotion selected' : 'emotion'} onClick={() => onEmotion(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
      <div className="choice-list">
        {modeStyles[mode].map((item) => (
          <button key={item} className={style === item ? 'choice selected' : 'choice'} onClick={() => onStyle(item)}>
            <span className="choice-radio">{style === item && <span />}</span>
            <span>
              <strong>{item}</strong>
              <small>
                {styleDescriptions[mode][item] ?? 'Choose the kind of support that feels right for you.'}
              </small>
            </span>
          </button>
        ))}
      </div>
      <div className="setup-actions">
        <button className="primary-button next-button" onClick={onContinue}>
          Continue <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
