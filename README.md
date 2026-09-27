# Smart Mirror

"A mirror that sees for you." Accessibility-first smart mirror — clock/weather
dashboard, voice-activated outfit check via Gemini 2.5 Flash, in-browser face
recognition, integrated Alexa Skill.

Stack: React (Vite) frontend, Flask backend, face-api.js, Gemini 2.5 Flash.

## Layout

```
frontend/   React app that renders on the Dell (fullscreen Chrome)
backend/    Flask — Gemini outfit check, weather proxy, profiles, Alexa bridge
```

## Run it

Backend:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then fill in GEMINI_API_KEY + OPENWEATHER_API_KEY
python app.py               # serves on :5001
```

Frontend (new terminal):

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173` in Chrome, then fullscreen it on the Dell
(View > Enter Full Screen, or Cmd+Ctrl+F). The center stays reflective; widgets
sit in the corners.

## Face recognition models (one-time)

face-api.js needs its weight files in `frontend/public/models/`. Grab them from
the face-api.js repo:

```bash
cd frontend/public/models
BASE=https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights
for f in tiny_face_detector_model-weights_manifest.json \
         tiny_face_detector_model-shard1 \
         face_landmark_68_model-weights_manifest.json \
         face_landmark_68_model-shard1 \
         face_recognition_model-weights_manifest.json \
         face_recognition_model-shard1 \
         face_recognition_model-shard2; do
  curl -sO "$BASE/$f"
done
```

## Registering a face

`frontend/public/faces.json` holds registered profiles:

```json
[{ "label": "Star", "descriptors": [[...128 floats...]] }]
```

You generate the 128-float descriptor once per person with an enroll step
(compute `faceapi.detectSingleFace(...).withFaceLandmarks().withFaceDescriptor()`
on a few photos and save `.descriptor`). Greeting/prefs for each label live in
`backend/profiles.json`.

## Voice

Two paths:
- **Local (demo-ready now):** browser Web Speech API hears "how do I look" /
  "check my outfit" / "what time is it" directly. No Alexa needed.
- **Integrated Alexa:** Echo Dot -> custom Skill -> Lambda -> ngrok -> Flask
  `/api/alexa`. Bridge is sketched in `app.py` (pending-flag pattern, since the
  webcam lives in the browser not the backend).

## Notes

- True black background is load-bearing — any grey reads semi-reflective through
  the two-way film. Keep widget text bright and weights >= medium so thin
  strokes dont vanish.
- Everything meaningful is spoken. The on-screen text mirrors the voice for
  sighted users; the voice is the primary interface.
