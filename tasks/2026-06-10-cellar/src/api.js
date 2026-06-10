// Reads the key from an Expo public env var so it is inlined at build time.
// For personal/internal use this is fine; for a distributed app, proxy it.
const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";
const ENDPOINT = "https://api.anthropic.com/v1/messages";

function extractText(data) {
  return (data?.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export function parseJSON(text) {
  let t = (text || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(t);
  } catch (e) {}
  const slice = (open, close) => {
    const a = t.indexOf(open);
    const b = t.lastIndexOf(close);
    if (a !== -1 && b !== -1 && b > a) {
      try {
        return JSON.parse(t.slice(a, b + 1));
      } catch (e) {}
    }
    return null;
  };
  return slice("{", "}") || slice("[", "]");
}

export async function claude(messages, maxTokens = 1024) {
  if (!API_KEY) throw new Error("Missing EXPO_PUBLIC_ANTHROPIC_API_KEY");
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error("API " + res.status + ": " + body.slice(0, 200));
  }
  const data = await res.json();
  return extractText(data);
}

// base64Jpeg = raw base64 (no data: prefix)
export async function identifyWine(base64Jpeg) {
  const prompt =
    "You are a master sommelier identifying a wine from its label photo. Return ONLY a JSON object, no markdown or prose, with keys: " +
    "name (the cuvée/wine name), producer, vintage (year string or ''), type (one of Red, White, Rosé, Sparkling, Dessert, Fortified, Orange), " +
    "grapes (array of grape varieties), region, country, " +
    "grapeOrigin (1-2 concise sentences: where these grapes originate and where they're classically grown), " +
    "winemaking (2 concise sentences on how this style is typically vinified — fermentation, oak, aging), " +
    "profile (2 concise sentences: aromas, palate, body, finish). " +
    "If the label is unclear, give your best expert estimate; use '' or [] for true unknowns. Keep every field tight.";
  const text = await claude([
    {
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64Jpeg } },
        { type: "text", text: prompt },
      ],
    },
  ]);
  return parseJSON(text);
}

export async function suggestWines(liked) {
  const fav = liked
    .slice(0, 8)
    .map(
      (w) =>
        `${w.name} (${w.producer}, ${w.vintage || "NV"}) — ${w.type}, ${(w.grapes || []).join("/")}, ${w.region} ${w.country}, scored ${w.score}`
    )
    .join("\n");
  const prompt =
    `A wine lover's highest-rated bottles:\n${fav}\n\n` +
    `Return ONLY JSON: {"discover":[{"name","producer","region","grape","reason"}], "revisit":[{"name","reason"}]}. ` +
    `"discover": 5 specific real wines they likely haven't tried but would enjoy given the pattern — each reason one short sentence. ` +
    `"revisit": 2 of THEIR listed wines worth returning to, each with a one-line reason. Be concise.`;
  return parseJSON(await claude([{ role: "user", content: prompt }]));
}

export async function readPalate(stats, topNames) {
  const prompt =
    `Based on a taster's cellar — favorite grapes: ${stats.grapes.join(", ") || "varied"}; ` +
    `favorite regions: ${stats.regions.join(", ") || "varied"}; top wines: ${topNames.join(", ")}. ` +
    `Write 2 short paragraphs (no headings, no markdown) describing their palate: the styles and characteristics ` +
    `they gravitate toward, and what that suggests they'd enjoy exploring. Warm, knowledgeable tone.`;
  return claude([{ role: "user", content: prompt }]);
}
