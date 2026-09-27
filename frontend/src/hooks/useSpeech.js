import { useCallback, useEffect, useRef } from "react";

export function useSpeech() {
  const voiceRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const preferred = ["Ava (Premium)", "Ava", "Samantha", "Google US English"];
      voiceRef.current =
        preferred.map((n) => voices.find((v) => v.name === n)).find(Boolean) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];
    }
    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const speak = useCallback((text, { interrupt = true, rate = 1 } = {}) => {
    if (!text) return;
    const synth = window.speechSynthesis;
    if (interrupt) synth.cancel();

    const chunks = (text.match(/[^.!?]+[.!?]*/g) || [text])
      .map((c) => c.trim())
      .filter(Boolean);

    chunksRef.current = [];

    const queue = () => {
      chunks.forEach((chunk) => {
        const u = new SpeechSynthesisUtterance(chunk);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = rate;
        u.pitch = 1;
        chunksRef.current.push(u);
        synth.speak(u);
      });
    };

    if (interrupt) setTimeout(queue, 60);
    else queue();
  }, []);

  const stop = useCallback(() => window.speechSynthesis.cancel(), []);

  return { speak, stop };
}
