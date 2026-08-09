import { useState } from 'react';
import { ChatIcon, HelpIcon, PhoneIcon, QuietIcon, RouteIcon, TrendIcon } from './icons';

// Calm, plain encouragement — not forced cheerfulness. One picked at random
// per page load, not per re-render, so it doesn't shift under someone mid-use.
const SLOGANS = [
  'One calm step at a time.',
  'You choose the pace today.',
  'Quieter paths are always here for you.',
  'Small steps, real progress.',
  'There’s no wrong way to get there.',
  'You’re allowed to take the quiet way.',
  'Every route is yours to choose.',
  'Moving at your own rhythm — always okay.',
];

const FAQ_ITEMS = [
  {
    q: 'How does hush decide High or Low?',
    a: 'It averages live pedestrian counts from sensors within 50 m of the path, and compares that to your own limit (default 100 people/min — you can change it). It’s your number, not a fixed rule.',
  },
  {
    q: 'What happens where there’s no sensor?',
    a: '“No data” is shown honestly — a gap in coverage is never assumed to be calm just because nothing was measured there.',
  },
  {
    q: 'Do I need an account?',
    a: 'No. Your limit and saved places stay on this device only, in your browser. There’s no login.',
  },
  {
    q: 'Is my location shared with anyone?',
    a: 'It’s used live, in the moment, only to find your route or nearby quiet spaces. It’s never stored on our servers.',
  },
];

export function Home({ onNavigate }) {
  const [slogan] = useState(() => SLOGANS[Math.floor(Math.random() * SLOGANS.length)]);
  const [showFaq, setShowFaq] = useState(false);

  return (
    <div className="home">
      <div className="home__intro">
        <p className="home__slogan">{slogan}</p>
        <h1>Where would you like to go?</h1>
        <p className="field-note">Pick one. Everything else stays out of the way.</p>
      </div>

      <div className="home__options">
        <button
          type="button"
          className="home-card home-card--primary"
          onClick={() => onNavigate('plan')}
        >
          <RouteIcon size={32} />
          <span className="home-card__body">
            <span className="home-card__title">Plan a route</span>
            <span className="home-card__desc">
              Find calmer walking routes across the CBD.
            </span>
          </span>
        </button>

        <div className="home__secondary">
          <button
            type="button"
            className="home-card home-card--square"
            onClick={() => onNavigate('refuge')}
          >
            <QuietIcon size={26} />
            <span className="home-card__title">Quiet space</span>
          </button>

          <button type="button" className="home-card home-card--square" disabled>
            <TrendIcon size={26} />
            <span className="home-card__title">Crowd predictor</span>
            <span className="home-card__badge">Coming later</span>
          </button>
        </div>
      </div>

      <div className="home__support" aria-label="Support and help">
        <p className="home__support-heading">Need a hand?</p>
        <div className="home__support-row">
          <a className="support-pill" href="tel:131114">
            <PhoneIcon size={18} />
            Lifeline · 13 11 14
          </a>
          <button type="button" className="support-pill" disabled>
            <ChatIcon size={18} />
            Chat helper
            <span className="home-card__badge">Coming later</span>
          </button>
          <button
            type="button"
            className="support-pill"
            aria-expanded={showFaq}
            onClick={() => setShowFaq((v) => !v)}
          >
            <HelpIcon size={18} />
            FAQ
          </button>
        </div>

        {showFaq ? (
          <dl className="faq-list">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="faq-item">
                <dt>{item.q}</dt>
                <dd>{item.a}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </div>
  );
}
