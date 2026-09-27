import { useCallback, useEffect, useRef, useState } from "react";
import Clock from "./components/Clock";
import Weather from "./components/Weather";
import OutfitCheck from "./components/OutfitCheck";
import FaceRecognition from "./components/FaceRecognition";
import Transcript from "./components/Transcript";
import Greeting from "./components/Greeting";
import HintLine from "./components/HintLine";
import { useCamera } from "./hooks/useCamera";
import { useSpeech } from "./hooks/useSpeech";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import { useFramePush } from "./hooks/useFramePush";
import { checkOutfit, askMirror, getProfile } from "./lib/api";

const WAKE_WORDS = ["hey mirror", "okay mirror", "ok mirror", "mirror"];

export default function App() {
  const { videoRef, ready, captureFrame } = useCamera();
  const { speak } = useSpeech();

  const [user, setUser] = useState(null);
  const [outfitStatus, setOutfitStatus] = useState("idle");
  const [outfitResult, setOutfitResult] = useState("");
  const clearTimerRef = useRef(null);
  const busyRef = useRef(false);

  useFramePush(captureFrame, { enabled: ready });

  const showAndSpeak = useCallback(
    (text) => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setOutfitResult(text);
      setOutfitStatus("done");
      speak(text, { interrupt: true });
      clearTimerRef.current = setTimeout(() => setOutfitStatus("idle"), 15000);
    },
    [speak]
  );

  const runOutfitCheck = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    setOutfitStatus("capturing");
    await new Promise((r) => setTimeout(r, 300));
    const frame = captureFrame();
    if (!frame) {
      setOutfitStatus("error");
      speak("I cant see the camera right now.");
      busyRef.current = false;
      return;
    }
    setOutfitStatus("analyzing");
    try {
      const { speech } = await checkOutfit(frame, { profile: user?.label });
      showAndSpeak(speech);
    } catch {
      setOutfitStatus("error");
      speak("Something went wrong reading your outfit. Try again.");
    }
    busyRef.current = false;
  }, [captureFrame, speak, user, showAndSpeak]);

  const runAsk = useCallback(
    async (question) => {
      if (busyRef.current) return;
      busyRef.current = true;
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      setOutfitStatus("analyzing");
      const frame = captureFrame();
      try {
        const { speech } = await askMirror(question, frame);
        showAndSpeak(speech);
      } catch {
        setOutfitStatus("error");
        speak("Sorry, I couldnt answer that. Try again.");
      }
      busyRef.current = false;
    },
    [captureFrame, speak, showAndSpeak]
  );

  const handleUnmatched = useCallback(
    (text) => {
      const wake = WAKE_WORDS.find((w) => text.startsWith(w));
      if (!wake) return;
      const question = text.slice(wake.length).replace(/^[,\s]+/, "");
      if (question) runAsk(question);
    },
    [runAsk]
  );

  const { listening, transcript } = useVoiceCommands(
    [
      {
        phrases: ["how do i look", "check my outfit", "what should i wear"],
        action: runOutfitCheck,
      },
      {
        phrases: ["what time is it", "tell me the time"],
        action: () =>
          speak(
            new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })
          ),
      },
    ],
    { enabled: ready, fallback: handleUnmatched }
  );

  const handleRecognize = useCallback(
    async (label) => {
      if (!label) {
        setUser(null);
        return;
      }
      try {
        const profile = await getProfile(label);
        setUser({ label, greeting: profile.greeting });
        speak(profile.greeting || `Hi ${label}.`);
      } catch {
        setUser({ label });
        speak(`Hi ${label}.`);
      }
    },
    [speak]
  );

  useEffect(() => {
    if (ready) {
      speak("Mirror ready. Ask me anything, just start with, mirror.");
    }
  }, [ready, speak]);

  return (
    <main className="mirror" aria-label="Smart mirror">
      <video ref={videoRef} playsInline muted className="sr-only" />

      <div className="zone zone--top-left">
        <Clock />
        <div className="accent-divider" aria-hidden="true" />
        <Greeting name={user?.label} />
      </div>

      <div className="zone zone--top-right">
        <Weather />
      </div>

      <div className="zone zone--bottom-center">
        <OutfitCheck status={outfitStatus} result={outfitResult} />
      </div>

      <HintLine />
      <Transcript text={transcript} listening={listening} />

      <FaceRecognition
        videoRef={videoRef}
        onRecognize={handleRecognize}
        enabled={ready}
      />

      <style>{`
        :root { --accent-warm: #c9a24b; }
        .accent-divider {
          width: clamp(60px, 8vw, 120px);
          height: 2px;
          margin: 0.7em 0 0.2em;
          background: linear-gradient(
            to right,
            var(--accent-warm) 0%,
            rgba(201, 162, 75, 0.15) 100%
          );
          border-radius: 2px;
          opacity: 0.85;
        }
      `}</style>
    </main>
  );
}
