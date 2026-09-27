async function post(path, body) {
  const res = await fetch(`/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function get(path) {
  const res = await fetch(`/api${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export function checkOutfit(imageBase64, { profile } = {}) {
  return post("/outfit-check", { image: imageBase64, profile });
}

export function askMirror(question, imageBase64) {
  return post("/ask", { question, image: imageBase64 });
}

export function getWeather() {
  return get("/weather");
}

export function getProfile(label) {
  return get(`/profile/${encodeURIComponent(label)}`);
}
