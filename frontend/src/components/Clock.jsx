import { useEffect, useState } from "react";

const TIME_FMT = { hour: "numeric", minute: "2-digit" };
const DATE_FMT = { weekday: "long", month: "long", day: "numeric" };

export default function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000 * 15);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], TIME_FMT);
  const date = now.toLocaleDateString([], DATE_FMT);

  return (
    <div className="clock fade-in">
      <div className="clock__time" aria-hidden="true">
        {time}
      </div>
      <div className="clock__date" aria-hidden="true">
        {date}
      </div>
      {/* spoken on request via voice command, not read automatically on every tick */}
      <span className="sr-only">
        {time} on {date}
      </span>

      <style>{`
        .clock__time {
          font-family: var(--font-display);
          font-size: clamp(64px, 11vw, 168px);
          line-height: 0.9;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .clock__date {
          font-size: clamp(16px, 2vw, 26px);
          color: var(--text-dim);
          margin-top: 0.4em;
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
