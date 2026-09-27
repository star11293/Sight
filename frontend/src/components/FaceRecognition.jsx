import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";

const MODEL_URL = "/models";
const MATCH_THRESHOLD = 0.5; // lower = stricter. 0.5 is a good demo default.
const POLL_MS = 1500;

/**
 * Runs entirely in the browser on TensorFlow.js. Loads the tiny detector +
 * landmark + recognition nets, builds a matcher from registered profiles, and
 * calls onRecognize(label|null) whenever the person in front of the mirror
 * changes.
 *
 * Registered faces come from /public/faces.json — an array of
 *   { label: "Star", descriptors: [[...128 floats], ...] }
 * You generate that once in a setup/enroll step (see scripts/enroll notes).
 */
export default function FaceRecognition({ videoRef, onRecognize, enabled = true }) {
  const matcherRef = useRef(null);
  const lastLabelRef = useRef(undefined);

  useEffect(() => {
    if (!enabled) return;
    let timer = null;
    let stopped = false;

    async function init() {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      // Build the matcher from saved profiles. If none exist yet the mirror
      // still works, it just wont personalize.
      try {
        const res = await fetch("/faces.json");
        if (res.ok) {
          const profiles = await res.json();
          const labeled = profiles.map(
            (p) =>
              new faceapi.LabeledFaceDescriptors(
                p.label,
                p.descriptors.map((d) => new Float32Array(d))
              )
          );
          if (labeled.length) {
            matcherRef.current = new faceapi.FaceMatcher(
              labeled,
              MATCH_THRESHOLD
            );
          }
        }
      } catch {
        /* no profiles yet, thats fine */
      }

      if (!stopped) loop();
    }

    async function loop() {
      const video = videoRef.current;
      if (video && video.videoWidth && matcherRef.current) {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        let label = null;
        if (detection) {
          const best = matcherRef.current.findBestMatch(detection.descriptor);
          label = best.label === "unknown" ? null : best.label;
        }

        if (label !== lastLabelRef.current) {
          lastLabelRef.current = label;
          onRecognize(label);
        }
      }
      if (!stopped) timer = setTimeout(loop, POLL_MS);
    }

    init();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [videoRef, onRecognize, enabled]);

  return null; // headless — it only drives recognition, no UI of its own
}
