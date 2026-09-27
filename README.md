# Sight

**A smart mirror that describes your appearance and surroundings out loud, giving blind and low-vision users an independent way to see themselves.**

Built at hackUMBC 2026.

For someone who is blind or has low vision, a simple daily question — *"How do I look?"* — often means depending on another person. Sight answers it out loud. Stand in front of the mirror, ask by voice, and it describes your outfit, reads text, identifies objects, and names colors — using a live camera and Google Gemini's vision AI.

## Features

Speak any of these (start with "mirror," or use the Alexa skill for the outfit check):

- **"How do I look?"** — describes your outfit: items, colors, whether they coordinate, and anything off (stain, mismatch, inside-out)
- **"Read this"** — reads text aloud from anything you hold up (labels, letters, medicine bottles)
- **"What is this?"** — identifies objects
- **"What color is this?"** — names colors specifically (for matching clothes)
- **"Describe what you see"** — describes the scene
- **"Do these go together?"** — styling judgment on two items
- Ambient dashboard: clock, date, personalized greeting, and live weather, shown as bright text that appears to float on the mirror glass

Everything meaningful is **spoken**, so the mirror works whether or not you can see the screen.

## How it works

- **Frontend:** React (Vite), rendered fullscreen behind two-way mirror film. A true-black background keeps the glass reflective while bright widgets show through.
- **Backend:** Python / Flask, serving the vision and voice endpoints.
- **Vision:** Google Gemini 2.5 Flash analyzes a live camera frame and generates a spoken description.
- **Voice in:** the browser Web Speech API for local commands, plus a custom Amazon Alexa Skill.
- **Face recognition:** face-api.js (TensorFlow.js), in-browser, for personalized greetings.

### The interesting problem
Alexa runs in the cloud, but the camera lives in the browser — and Alexa expects a response in under 8 seconds. Sight solves this by having the browser continuously push its latest camera frame to the backend, so when Alexa asks, a fresh frame is already waiting to be analyzed and spoken back.

## Tech stack
React · Vite · Python · Flask · Google Gemini 2.5 Flash · face-api.js · TensorFlow.js · Web Speech API · Amazon Alexa Skills Kit · ngrok

## Hardware
- Monitor with two-way mirror film
- USB webcam (Logitech C270)
- A computer to drive the display
- Amazon Echo Dot (optional, for the Alexa voice)

## Running it locally

**Backend:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your GEMINI_API_KEY and OPENWEATHER_API_KEY
python app.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in Chrome, allow camera and mic, and fullscreen it on the mirror display.

Face-recognition models go in `frontend/public/models/` (download the tiny_face_detector, face_landmark_68, and face_recognition weights from the face-api.js repo).

## Note on AI
AI assistants were used during development for debugging and scaffolding, alongside the Google Gemini API that powers the product itself.

## License
MIT
