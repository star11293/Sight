import { useEffect } from "react";

/**
 * Continuously pushes the latest camera frame to the backend so the Alexa path
 * always has a recent frame ready (Alexa can't wait for the browser to be asked).
 * Lightweight: one small JPEG every `intervalMs`. Only runs when ready.
 */
export function useFramePush(captureFrame, { enabled = true, intervalMs = 2000 } = {}) {
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;

    const id = setInterval(async () => {
      if (stopped) return;
      const frame = captureFrame(0.6); // lower quality is fine for analysis, keeps it light
      if (!frame) return;
      try {
        await fetch("/api/frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: frame }),
        });
      } catch {
        /* backend momentarily unavailable, ignore and try next tick */
      }
    }, intervalMs);

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [captureFrame, enabled, intervalMs]);
}
