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

  return (
    <section className="page-shell narrow">
      <button className="back-button" onClick={onBack}><ArrowLeft size={15} /> Change mode</button>
      <div className="section-heading">
        <div className="eyebrow">STEP 2 OF 3 · {mode.toUpperCase()}</div>
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
                {mode === 'vent'     ? 'Hush Companion will adapt its support.' :
                 mode === 'debate'   ? 'Hush Companion will adapt its challenge.' :
                 mode === 'wellness' ? 'Hush Companion will adapt its check-in.' :
                                       'Hush Companion will adapt its narration.'}
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
