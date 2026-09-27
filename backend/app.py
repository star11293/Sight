"""Smart mirror backend. Alexa Option 2: Echo Dot speaks the outfit analysis."""

import json
import os
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

app = Flask(__name__)

GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "")
OWM_KEY = os.environ.get("OPENWEATHER_API_KEY", "")
LAT = os.environ.get("MIRROR_LAT", "39.4196")
LON = os.environ.get("MIRROR_LON", "-76.7803")

GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-2.5-flash:generateContent"
)

PROFILES_PATH = Path(__file__).parent / "profiles.json"

GEN_CONFIG = {
    "temperature": 0.6,
    "maxOutputTokens": 1024,
    "thinkingConfig": {"thinkingBudget": 0},
}

# Alexa has a hard ~8s timeout, so the Alexa path uses a tighter budget and a
# shorter answer so Gemini returns in time for the Dot to speak it.
ALEXA_GEN_CONFIG = {
    "temperature": 0.6,
    "maxOutputTokens": 300,
    "thinkingConfig": {"thinkingBudget": 0},
}

# The browser pushes its latest camera frame here every couple seconds, so the
# backend always has a recent frame ready when Alexa asks. Kept in memory only.
_latest_frame = {"data": None, "ts": 0}


def gemini(parts, gen_config=None):
    r = requests.post(
        GEMINI_URL,
        headers={"x-goog-api-key": GEMINI_KEY},
        json={"contents": [{"parts": parts}], "generationConfig": gen_config or GEN_CONFIG},
        timeout=25,
    )
    r.raise_for_status()
    return r.json()["candidates"][0]["content"]["parts"][0]["text"].strip()


OUTFIT_PROMPT = """You are the voice of a smart mirror built for visually impaired users.
A person is standing in front of you. Describe what they are wearing clearly and
specifically, the way a trusted friend would if the person could not see themselves:
name each item and its color, top to bottom, say whether the colors and styles work
together, and call out anything worth knowing (mismatched, inside out, wrinkled,
stained, uneven collar, untied shoes). Be warm, direct, and concrete. Speak in full
sentences, no lists, no markdown. Talk to them as "you". Aim for 4 to 6 sentences."""

ASK_PROMPT = """You are the voice of a smart mirror built for visually impaired users.
A person standing in front of you just asked: "{question}"

A current photo from the mirror's camera is attached. If the question is about their
appearance, clothing, colors, grooming, or anything visible, answer by looking at the
photo and be specific and honest. If the question is not about appearance, just answer
it helpfully. Always answer in natural spoken sentences, no lists, no markdown, talking
to them as "you". Keep it to a few sentences unless detail is needed."""

# Shorter prompt for the Alexa path — must come back fast and fit a spoken reply.
ALEXA_OUTFIT_PROMPT = """You are a smart mirror built for visually impaired users.
A person is in front of the camera (photo attached). In 2 to 3 warm, spoken sentences,
tell them what they are wearing, the colors, whether it works together, and flag
anything off (mismatched, inside out, stained). No lists, no markdown. Talk to them as "you"."""


@app.post("/api/frame")
def frame():
    """Browser pushes its latest camera frame here so Alexa can use it instantly."""
    data = request.get_json(silent=True) or {}
    img = data.get("image")
    if not img:
        return jsonify(error="no image"), 400
    _latest_frame["data"] = img
    _latest_frame["ts"] = time.time()
    return jsonify(ok=True)


@app.post("/api/outfit-check")
def outfit_check():
    data = request.get_json(silent=True) or {}
    image_b64 = data.get("image")
    if not image_b64:
        return jsonify(error="no image"), 400
    try:
        speech = gemini([
            {"text": OUTFIT_PROMPT},
            {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}},
        ])
        return jsonify(speech=speech)
    except Exception as e:  # noqa: BLE001
        app.logger.exception("gemini call failed")
        return jsonify(error=str(e)), 502


@app.post("/api/ask")
def ask():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    image_b64 = data.get("image")
    if not question:
        return jsonify(error="no question"), 400
    parts = [{"text": ASK_PROMPT.format(question=question)}]
    if image_b64:
        parts.append({"inline_data": {"mime_type": "image/jpeg", "data": image_b64}})
    try:
        speech = gemini(parts)
        return jsonify(speech=speech)
    except Exception as e:  # noqa: BLE001
        app.logger.exception("gemini ask failed")
        return jsonify(error=str(e)), 502


@app.get("/api/weather")
def weather():
    if not OWM_KEY:
        return jsonify(error="OPENWEATHER_API_KEY not set"), 500
    try:
        r = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": LAT, "lon": LON, "units": "imperial", "appid": OWM_KEY},
            timeout=10,
        )
        r.raise_for_status()
        d = r.json()
        return jsonify(
            temp=d["main"]["temp"],
            feels_like=d["main"]["feels_like"],
            description=d["weather"][0]["description"],
            location=d.get("name", "Home"),
        )
    except Exception as e:  # noqa: BLE001
        return jsonify(error=str(e)), 502


def load_profiles():
    if PROFILES_PATH.exists():
        return json.loads(PROFILES_PATH.read_text())
    return {}


@app.get("/api/profile/<label>")
def profile(label):
    p = load_profiles().get(label)
    if not p:
        return jsonify(greeting=f"Hi {label}."), 200
    return jsonify(p)


def alexa_reply(text, end=True):
    """Format a plain-text speech reply the way Alexa expects."""
    return jsonify({
        "version": "1.0",
        "response": {
            "outputSpeech": {"type": "PlainText", "text": text},
            "shouldEndSession": end,
        },
    })


@app.post("/api/alexa")
def alexa():
    body = request.get_json(silent=True) or {}
    req = body.get("request", {})
    req_type = req.get("type", "")

    # "open smart mirror" with no command
    if req_type == "LaunchRequest":
        return alexa_reply("Your mirror is ready. Ask me how you look.", end=False)

    if req_type == "IntentRequest":
        intent = req.get("intent", {}).get("name", "")
        if intent in ("HowDoILook", "CheckMyOutfit"):
            frame = _latest_frame["data"]
            age = time.time() - _latest_frame["ts"]
            # No recent frame means the mirror isn't open / camera off.
            if not frame or age > 15:
                return alexa_reply(
                    "I cant see the mirror camera right now. Make sure the mirror is on."
                )
            try:
                speech = gemini(
                    [
                        {"text": ALEXA_OUTFIT_PROMPT},
                        {"inline_data": {"mime_type": "image/jpeg", "data": frame}},
                    ],
                    gen_config=ALEXA_GEN_CONFIG,
                )
                return alexa_reply(speech)
            except Exception:  # noqa: BLE001
                app.logger.exception("alexa outfit check failed")
                return alexa_reply(
                    "Sorry, I had trouble reading your outfit. Please try again."
                )
        # Amazon's built-in stop/cancel/help intents
        if intent in ("AMAZON.StopIntent", "AMAZON.CancelIntent"):
            return alexa_reply("Okay.")
        return alexa_reply("You can ask me how you look.", end=False)

    return alexa_reply("You can ask me how you look.", end=False)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
