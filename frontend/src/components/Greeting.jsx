import { useEffect, useState } from "react";

function greetingFor(date) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ name }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // update on the hour boundaries is enough; every 5 min is simple and safe
    const id = setInterval(() => setNow(new Date()), 1000 * 60 * 5);
    return () => clearInterval(id);
  }, []);

  const line = name ? `${greetingFor(now)}, ${name}` : greetingFor(now);

  return (
    <p className="greeting fade-in" aria-hidden="true">
      {line}
      <style>{`
        .greeting {
          margin-top: 0.8em;
          font-size: clamp(18px, 2.2vw, 30px);
          color: var(--text-dim);
        }
      `}</style>
    </p>
  );
}
