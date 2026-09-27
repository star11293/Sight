import { useEffect, useRef, useState } from "react";

export default function Transcript({ text, listening }) {
  // "active" = we just heard something. Glows briefly after each recognized phrase.
  const [active, setActive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) return;
    setActive(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setActive(false), 2500);
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [text]);

  return (
    <div className="transcript">
      <span
        className="transcript__dot"
        data-on={listening}
        data-active={active}
      />
      <span className="transcript__text">{text || "listening…"}</span>
      <style>{`
        .transcript {
          position: fixed;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--text-faint);
        }
        .transcript__dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: #333;
          transition: background 0.3s ease;
        }
        /* idle-but-listening: soft steady breathing pulse */
        .transcript__dot[data-on="true"] {
          background: #7a7a52;
          animation: breathe 2.4s ease-in-out infinite;
        }
        /* just heard you: brighter glow burst */
        .transcript__dot[data-active="true"] {
          background: var(--accent);
          box-shadow: 0 0 10px 2px var(--accent);
          animation: none;
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.45; box-shadow: 0 0 0 0 rgba(122,122,82,0); }
          50%      { opacity: 1;    box-shadow: 0 0 8px 1px rgba(122,122,82,0.5); }
        }
        @media (prefers-reduced-motion: reduce) {
          .transcript__dot { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
