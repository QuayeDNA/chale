import { Fragment } from 'react';

/**
 * The tilted ink marquee under the hero — the questions scroll by on a 60s
 * loop, pausing while hovered. Doubled so the -50% keyframe wraps cleanly.
 * Pure decoration (aria-hidden); the real questions live in the deck.
 */
const QUESTIONS = [
  'When did you last feel completely understood by me?',
  'What belief did you hold at 18 that you let go of?',
  'Which of us survives the zombie film?',
  'Where do we wake up in ten years?',
  'What would you never tell the group chat?',
  'What do you need more of from me right now?',
  'Which family story do we never stop telling?',
];

export function Marquee() {
  const items = [...QUESTIONS, ...QUESTIONS];
  return (
    <div className="band-wrap">
      <div className="band" aria-hidden="true">
        <div>
          {items.map((q, i) => (
            <Fragment key={i}>
              <span>{q}</span>
              <b>✺</b>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
