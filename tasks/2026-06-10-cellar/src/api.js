const API_BASE = (process.env.EXPO_PUBLIC_API_BASE || "").replace(/\/$/, "");

async function callApi(action, payload) {
  if (!API_BASE) throw new Error("Missing EXPO_PUBLIC_API_BASE");
  const res = await fetch(`${API_BASE}/api/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error("API " + res.status + ": " + body.slice(0, 200));
  }
  return res.json();
}

export async function identifyWine(base64Jpeg) {
  const wine = await callApi("identify", { image: base64Jpeg });
  if (!wine || Array.isArray(wine) || typeof wine !== "object") {
    throw new Error("Wine identification returned an invalid response");
  }
  return wine;
}

export async function suggestWines(liked) {
  const result = await callApi("suggest", { wines: liked.slice(0, 8) });
  if (!result || !Array.isArray(result.discover)) {
    throw new Error("Wine suggestions returned an invalid response");
  }
  return result;
}

export async function readPalate(stats, topNames) {
  const result = await callApi("palate", { stats, topNames });
  if (!result?.text) throw new Error("Palate response was empty");
  return result.text;
}
