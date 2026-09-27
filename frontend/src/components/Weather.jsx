import { useEffect, useState } from "react";
import { getWeather } from "../lib/api";

// Pick a simple line-icon from the condition text. Bright strokes so it shows
// through the mirror film like the rest of the widgets.
function WeatherIcon({ description = "" }) {
  const d = description.toLowerCase();
  const stroke = "var(--text-primary)";
  const common = {
    width: "1em",
    height: "1em",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (d.includes("rain") || d.includes("drizzle") || d.includes("shower")) {
    return (
      <svg {...common}>
        <path d="M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A3.5 3.5 0 0 1 17 16H7z" />
        <line x1="8" y1="19" x2="8" y2="21" />
        <line x1="12" y1="19" x2="12" y2="22" />
        <line x1="16" y1="19" x2="16" y2="21" />
      </svg>
    );
  }
  if (d.includes("snow")) {
    return (
      <svg {...common}>
        <path d="M7 16a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A3.5 3.5 0 0 1 17 16H7z" />
        <line x1="8" y1="20" x2="8" y2="20" />
        <line x1="12" y1="21" x2="12" y2="21" />
        <line x1="16" y1="20" x2="16" y2="20" />
      </svg>
    );
  }
  if (d.includes("cloud") || d.includes("overcast") || d.includes("mist") || d.includes("fog")) {
    return (
      <svg {...common}>
        <path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.6A3.5 3.5 0 0 1 17 18H7z" />
      </svg>
    );
  }
  // default: clear / sun
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="7" y2="7" />
      <line x1="17" y1="17" x2="19.1" y2="19.1" />
      <line x1="4.9" y1="19.1" x2="7" y2="17" />
      <line x1="17" y1="7" x2="19.1" y2="4.9" />
    </svg>
  );
}

export default function Weather() {
  const [weather, setWeather] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const data = await getWeather();
        if (alive) setWeather(data);
      } catch {
        if (alive) setFailed(true);
      }
    }
    load();
    const id = setInterval(load, 1000 * 60 * 10);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (failed) {
    return <div className="weather weather--muted">Weather unavailable</div>;
  }
  if (!weather) return <div className="weather weather--muted">—</div>;

  return (
    <div className="weather fade-in">
      <div className="weather__row" aria-hidden="true">
        <span className="weather__icon">
          <WeatherIcon description={weather.description} />
        </span>
        <span className="weather__temp">{Math.round(weather.temp)}°</span>
      </div>
      <div className="weather__desc" aria-hidden="true">
        {weather.description}
      </div>
      <div className="weather__meta" aria-hidden="true">
        {weather.location} · feels {Math.round(weather.feels_like)}°
      </div>
      <span className="sr-only">
        {weather.description}, {Math.round(weather.temp)} degrees in{" "}
        {weather.location}
      </span>

      <style>{`
        .weather__row {
          display: flex;
          align-items: center;
          gap: 0.25em;
          justify-content: flex-end;
        }
        .weather__icon {
          font-size: clamp(30px, 4vw, 56px);
          line-height: 1;
          display: inline-flex;
          opacity: 0.9;
        }
        .weather__temp {
          font-family: var(--font-display);
          font-size: clamp(44px, 6vw, 88px);
          line-height: 1;
          color: var(--text-primary);
        }
        .weather__desc {
          font-size: clamp(15px, 1.8vw, 22px);
          color: var(--text-primary);
          text-transform: capitalize;
          margin-top: 0.2em;
        }
        .weather__meta {
          font-size: clamp(12px, 1.4vw, 16px);
          color: var(--text-faint);
          margin-top: 0.3em;
        }
        .weather--muted { color: var(--text-faint); font-size: 16px; }
      `}</style>
    </div>
  );
}
