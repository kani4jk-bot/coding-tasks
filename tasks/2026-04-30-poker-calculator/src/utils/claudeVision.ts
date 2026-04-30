import { Card } from '../types';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const VALID_RANKS = new Set(['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']);
const VALID_SUITS = new Set(['h', 'd', 'c', 's']);

function isValidCard(card: string): card is Card {
  return (
    typeof card === 'string' &&
    card.length === 2 &&
    VALID_RANKS.has(card[0]) &&
    VALID_SUITS.has(card[1])
  );
}

function normalizeCard(raw: string): Card | null {
  if (!raw || raw.length < 2) return null;
  let rank = raw[0].toUpperCase();
  const suit = raw[raw.length - 1].toLowerCase();

  // Normalize rank aliases
  if (rank === '1' && raw[1] === '0') rank = 'T'; // 10 → T
  if (!VALID_RANKS.has(rank)) return null;
  if (!VALID_SUITS.has(suit)) return null;

  return `${rank}${suit}` as Card;
}

export async function recognizeCardsFromImage(
  base64Image: string,
  apiKey: string,
  mediaType: 'image/jpeg' | 'image/png' = 'image/jpeg',
): Promise<{ cards: Card[]; error?: string }> {
  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64Image },
              },
              {
                type: 'text',
                text: `Identify every playing card visible in this image. Return ONLY a JSON array of card codes. Use this exact format: ["Ah","Kd","Qc","Js","Th"] where the first character is the rank (2-9, T for 10, J, Q, K, A) and the second is the suit (h=hearts, d=diamonds, c=clubs, s=spades). Return ONLY the JSON array, no other text.`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return { cards: [], error: (err as any)?.error?.message ?? `API error ${response.status}` };
    }

    const data = await response.json();
    const text: string = data?.content?.[0]?.text ?? '';

    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) return { cards: [], error: 'Could not parse card list from response.' };

    const raw: unknown[] = JSON.parse(match[0]);
    const cards = (raw as string[])
      .map(normalizeCard)
      .filter((c): c is Card => c !== null);

    return { cards };
  } catch (err: any) {
    return { cards: [], error: err?.message ?? 'Unknown error' };
  }
}