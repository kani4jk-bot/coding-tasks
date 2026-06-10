const MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_BODY_BYTES = 2_500_000;

const json = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function responseText(data) {
  return (data?.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || "")
    .join("")
    .trim();
}

async function generate(env, parts, jsonOutput = false) {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1200,
        ...(jsonOutput ? { responseMimeType: "application/json" } : {}),
      },
    }),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Gemini ${response.status}: ${detail}`);
  }

  const text = responseText(await response.json());
  if (!text) throw new Error("Gemini returned an empty response");
  return jsonOutput ? JSON.parse(text) : text;
}

async function identify(env, body) {
  if (typeof body.image !== "string" || body.image.length > 2_200_000) {
    return json({ error: "A valid label image is required" }, 400);
  }
  const prompt =
    "Identify this wine from its label. Return a JSON object with keys: name, producer, vintage, " +
    "type (Red, White, Rosé, Sparkling, Dessert, Fortified, or Orange), grapes (array), region, country, " +
    "grapeOrigin (1-2 concise sentences), winemaking (2 concise sentences), and profile (2 concise sentences). " +
    "Use empty strings or arrays for true unknowns. Do not invent a vintage that is not visible.";
  return json(await generate(env, [
    { inlineData: { mimeType: "image/jpeg", data: body.image } },
    { text: prompt },
  ], true));
}

async function suggest(env, body) {
  const wines = Array.isArray(body.wines) ? body.wines.slice(0, 8) : [];
  const favorites = wines.map((wine) =>
    `${wine.name} (${wine.producer || "unknown producer"}, ${wine.vintage || "NV"}) - ${wine.type}, ` +
    `${(wine.grapes || []).join("/")}, ${wine.region || ""} ${wine.country || ""}, score ${wine.score}`
  ).join("\n");
  const prompt =
    `A wine lover's highest-rated bottles:\n${favorites}\n\n` +
    'Return JSON: {"discover":[{"name","producer","region","grape","reason"}],"revisit":[{"name","reason"}]}. ' +
    "Recommend five specific real wines they would likely enjoy and two listed wines worth revisiting. Keep reasons concise.";
  return json(await generate(env, [{ text: prompt }], true));
}

async function palate(env, body) {
  const stats = body.stats || {};
  const topNames = Array.isArray(body.topNames) ? body.topNames.slice(0, 5) : [];
  const prompt =
    `Favorite grapes: ${(stats.grapes || []).join(", ") || "varied"}. ` +
    `Favorite regions: ${(stats.regions || []).join(", ") || "varied"}. ` +
    `Top wines: ${topNames.join(", ") || "not enough data"}. ` +
    "Write two short paragraphs describing this person's palate and what they might enjoy exploring. No headings or markdown.";
  return json({ text: await generate(env, [{ text: prompt }]) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, model: MODEL });
    }
    if (request.method !== "POST") return json({ error: "Not found" }, 404);
    if (!env.GEMINI_API_KEY) return json({ error: "Server is not configured" }, 503);
    if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
      return json({ error: "Request is too large" }, 413);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    try {
      if (url.pathname === "/api/identify") return await identify(env, body);
      if (url.pathname === "/api/suggest") return await suggest(env, body);
      if (url.pathname === "/api/palate") return await palate(env, body);
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error(error);
      return json({ error: "AI request failed" }, 502);
    }
  },
};
