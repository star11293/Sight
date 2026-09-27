/**
 * Bottom-center overlay for outfit / question answers. App drives status+result.
 * The answer now fades and rises gently into place instead of popping in.
 */
const COPY = {
  capturing: "Looking…",
  analyzing: "Reading your outfit…",
  error: "Couldnt see clearly. Try facing the mirror straight on.",
};

export default function OutfitCheck({ status, result }) {
  if (status === "idle") return null;

  const line = status === "done" ? result : COPY[status];
  // "done" gets the full elegant reveal; interim states just fade in softly.
  const revealClass = status === "done" ? "outfit__text outfit__text--reveal" : "outfit__text";

  return (
    <div className="outfit" role="status" aria-live="assertive">
      <p key={line} className={revealClass}>
        {line}
      </p>

      <style>{`
        .outfit {
          max-width: min(880px, 80vw);
        }
        .outfit__text {
          font-size: clamp(22px, 3.2vw, 40px);
          line-height: 1.35;
          color: var(--accent);
          font-weight: 500;
          animation: outfit-fade 0.7s ease both;
        }
        .outfit__text--reveal {
          animation: outfit-reveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes outfit-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes outfit-reveal {
          from { opacity: 0; transform: translateY(14px); letter-spacing: 0.04em; }
          to   { opacity: 1; transform: translateY(0);    letter-spacing: normal; }
        }
        @media (prefers-reduced-motion: reduce) {
          .outfit__text, .outfit__text--reveal { animation: none; }
        }
      `}</style>
    </div>
  );
}
