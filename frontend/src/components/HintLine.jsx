import { useEffect, useState } from "react";

// Gentle rotating prompts. Dim enough to preserve the mirror illusion, and they
// double as a cue for judges on what they can say.
const HINTS = [
  "Say “mirror, how do I look”",
  "Ask me anything, just start with “mirror”",
  "Try “Alexa, ask smart mirror how I look”",
  "Say “what time is it”",
];

export default function HintLine({ intervalMs = 6000 }) {
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      // fade out, swap, fade in
      setShown(false);
      setTimeout(() => {
        setI((n) => (n + 1) % HINTS.length);
        setShown(true);
      }, 600);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    <p className="hint" data-shown={shown} aria-hidden="true">
      {HINTS[i]}
      <style>{`
        .hint {
          position: fixed;
          bottom: 34px;
          left: 50%;
          transform: translateX(-50%);
          font-size: clamp(13px, 1.4vw, 17px);
          letter-spacing: 0.02em;
          color: var(--accent-warm, #c9a24b);
          opacity: 0.0;
          transition: opacity 0.6s ease;
          text-align: center;
          white-space: nowrap;
          pointer-events: none;
        }
        .hint[data-shown="true"] { opacity: 0.7; }
        @media (prefers-reduced-motion: reduce) {
          .hint { transition: none; }
        }
      `}</style>
    </p>
  );
}
