import { useCallback, useEffect, useRef, useState } from "react";

/**
 * One shared webcam stream for the whole mirror. Both the outfit check and the
 * face recognition read from the same C270 feed instead of each grabbing their
 * own (macOS only lets one thing own the camera cleanly).
 *
 * Returns a videoRef to attach to a <video>, a ready flag, and captureFrame()
 * which returns a base64 JPEG of the current frame.
 */
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setReady(true);
      } catch (err) {
        setError(err);
      }
    }

    start();
    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const captureFrame = useCallback((quality = 0.85) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    // strip the data-url prefix, backend just wants the base64 payload
    return canvas.toDataURL("image/jpeg", quality).split(",")[1];
  }, []);

  return { videoRef, ready, error, captureFrame };
}
