import { useEffect, useRef, useState } from "react";

// If the mic hears any of these, the command was meant for the Echo Dot, not the
// mirror's local listener — so ignore it and let real Alexa answer. Prevents the
// mirror and Alexa both responding to "Alexa, how do I look".
const ALEXA_WORDS = ["alexa", "echo", "amazon"];

export function useVoiceCommands(commands, { enabled = true, fallback } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const commandsRef = useRef(commands);
  const fallbackRef = useRef(fallback);
  const wantOnRef = useRef(enabled);
  commandsRef.current = commands;
  fallbackRef.current = fallback;
  wantOnRef.current = enabled;

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !enabled) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    const restart = () => {
      if (!wantOnRef.current) return;
      setTimeout(() => {
        try { recognition.start(); } catch { /* already running */ }
      }, 300);
    };

    recognition.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript
        .trim()
        .toLowerCase();
      setTranscript(text);

      // Ignore the mirror's own voice coming back through the mic.
      if (window.speechSynthesis.speaking) return;

      // Command was addressed to Alexa — let the Echo Dot handle it, stay quiet.
      if (ALEXA_WORDS.some((w) => text.includes(w))) return;

      for (const cmd of commandsRef.current) {
        if (cmd.phrases.some((p) => text.includes(p))) {
          cmd.action(text);
          return;
        }
      }
      if (fallbackRef.current) fallbackRef.current(text);
    };

    recognition.onstart = () => setListening(true);
    recognition.onend = () => { setListening(false); restart(); };
    recognition.onerror = (e) => {
      if (e.error !== "not-allowed") restart();
    };

    try { recognition.start(); } catch { /* ignore */ }

    return () => {
      wantOnRef.current = false;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [enabled]);

  return { listening, transcript };
}
