import { Platform } from "react-native";

// warm "cellar dark" palette
export const C = {
  bg: "#17110F",
  surface: "#221A16",
  surface2: "#2C221C",
  border: "#3C2E27",
  text: "#EDE4D6",
  muted: "#A9988A",
  faint: "#7A6B5E",
  burgundy: "#9B2D3C",
  burgundyDim: "#6F2530",
  brass: "#C7A24A",
  brassDim: "#7D6630",
};

export const serif = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

// 0–10 split in thirds, à la head-to-head ranking
export const BANDS = {
  loved: { label: "Loved it", max: 10.0, min: 6.7 },
  good: { label: "It was good", max: 6.6, min: 3.4 },
  pass: { label: "Not for me", max: 3.3, min: 0.0 },
};
export const SENT_ORDER = ["loved", "good", "pass"];

export const TYPES = ["Red", "White", "Rosé", "Sparkling", "Dessert", "Fortified", "Orange"];
export const TYPE_COLOR = {
  Red: "#9B2D3C",
  White: "#C7A24A",
  "Rosé": "#C77E86",
  Sparkling: "#D8C57A",
  Dessert: "#B8862F",
  Fortified: "#7E2F2A",
  Orange: "#C77B3A",
};

// scoring
export function scoreFor(band, i, k) {
  const { max, min } = BANDS[band];
  if (k <= 1) return Math.round(((max + min) / 2) * 10) / 10;
  const v = max - (i / (k - 1)) * (max - min);
  return Math.round(v * 10) / 10;
}
export function recompute(wines) {
  const out = [];
  for (const band of SENT_ORDER) {
    const items = wines.filter((w) => w.sentiment === band).sort((a, b) => a.bandRank - b.bandRank);
    items.forEach((w, i) => out.push({ ...w, bandRank: i, score: scoreFor(band, i, items.length) }));
  }
  return out;
}
