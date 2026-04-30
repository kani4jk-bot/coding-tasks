import { Card, HandResult, Suit } from '../types';

// ─── Card Primitives ───────────────────────────────────────────────────────────
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['h', 'd', 'c', 's'] as const;

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function getAllCards(): Card[] {
  return RANKS.flatMap(r => SUITS.map(s => `${r}${s}`));
}

export function cardRank(card: Card): number {
  return RANK_VALUES[card[0]] ?? 0;
}

export function cardSuit(card: Card): Suit {
  return card[1] as Suit;
}

export function cardLabel(card: Card): string {
  const r = card[0];
  const s = card[1];
  const rank = r === 'T' ? '10' : r;
  const suit = { h: '♥', d: '♦', c: '♣', s: '♠' }[s] ?? s;
  return `${rank}${suit}`;
}

export function suitColor(card: Card): 'red' | 'black' {
  return ['h', 'd'].includes(card[1]) ? 'red' : 'black';
}

// ─── Combinatorics ────────────────────────────────────────────────────────────
function combCount(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return Math.round(result);
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...getCombinations(rest, k - 1).map(c => [first, ...c]),
    ...getCombinations(rest, k),
  ];
}

// ─── 5-Card Hand Evaluator ────────────────────────────────────────────────────
const RANK_NAMES: Record<number, [string, string]> = {
  2: ['2', '2s'], 3: ['3', '3s'], 4: ['4', '4s'], 5: ['5', '5s'],
  6: ['6', '6s'], 7: ['7', '7s'], 8: ['8', '8s'], 9: ['9', '9s'],
  10: ['10', 'Tens'], 11: ['Jack', 'Jacks'], 12: ['Queen', 'Queens'],
  13: ['King', 'Kings'], 14: ['Ace', 'Aces'],
};

function rankName(value: number, plural = true): string {
  const entry = RANK_NAMES[value];
  return entry ? entry[plural ? 1 : 0] : String(value);
}

function score5Cards(cards: Card[]): { score: number; name: string; description: string } {
  const ranks = cards.map(cardRank).sort((a, b) => b - a);
  const suits = cards.map(cardSuit);

  const isFlush = suits.every(s => s === suits[0]);

  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;
  if (uniqueRanks.length >= 5) {
    for (let i = 0; i <= uniqueRanks.length - 5; i++) {
      if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
        isStraight = true;
        straightHigh = uniqueRanks[i];
        break;
      }
    }
  }
  // Wheel (A-2-3-4-5)
  if (!isStraight && uniqueRanks.includes(14) && [2, 3, 4, 5].every(r => uniqueRanks.includes(r))) {
    isStraight = true;
    straightHigh = 5;
  }

  const rankCounts: Record<number, number> = {};
  ranks.forEach(r => { rankCounts[r] = (rankCounts[r] ?? 0) + 1; });
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  const byCount = Object.entries(rankCounts)
    .sort((a, b) => b[1] - a[1] || Number(b[0]) - Number(a[0]))
    .map(([r]) => Number(r));

  if (isFlush && isStraight && straightHigh === 14) {
    return { score: 9000000, name: 'Royal Flush', description: 'The unbeatable hand!' };
  }
  if (isFlush && isStraight) {
    return { score: 8000000 + straightHigh, name: 'Straight Flush', description: `${rankName(straightHigh, false)}-high straight flush` };
  }
  if (counts[0] === 4) {
    return { score: 7000000 + byCount[0] * 100 + byCount[1], name: 'Four of a Kind', description: `Quad ${rankName(byCount[0])}` };
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { score: 6000000 + byCount[0] * 100 + byCount[1], name: 'Full House', description: `${rankName(byCount[0])} full of ${rankName(byCount[1])}` };
  }
  if (isFlush) {
    const fs = ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
    return { score: 5000000 + fs, name: 'Flush', description: `${rankName(ranks[0], false)}-high flush` };
  }
  if (isStraight) {
    return { score: 4000000 + straightHigh, name: 'Straight', description: `${rankName(straightHigh, false)}-high straight` };
  }
  if (counts[0] === 3) {
    const ks = byCount.slice(1);
    return { score: 3000000 + byCount[0] * 10000 + ks[0] * 100 + ks[1], name: 'Three of a Kind', description: `Trip ${rankName(byCount[0])}` };
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return { score: 2000000 + byCount[0] * 10000 + byCount[1] * 100 + byCount[2], name: 'Two Pair', description: `${rankName(byCount[0])} & ${rankName(byCount[1])}` };
  }
  if (counts[0] === 2) {
    const ks = byCount.slice(1);
    return { score: 1000000 + byCount[0] * 10000 + ks[0] * 100 + ks[1] * 10 + ks[2], name: 'Pair', description: `Pair of ${rankName(byCount[0])}` };
  }
  const hs = ranks.reduce((acc, r, i) => acc + r * Math.pow(15, 4 - i), 0);
  return { score: hs, name: 'High Card', description: `${rankName(ranks[0], false)}-high` };
}

export function evaluateBestHand(holeCards: (Card | null)[], boardCards: (Card | null)[]): HandResult {
  const all = [...holeCards, ...boardCards].filter(Boolean) as Card[];
  if (all.length < 5) {
    return { rank: -1, name: '—', description: 'Need 5+ cards', score: 0 };
  }
  const combos = getCombinations(all, 5);
  let best = { score: -1, name: 'High Card', description: '' };
  for (const combo of combos) {
    const result = score5Cards(combo);
    if (result.score > best.score) best = result;
  }
  return { rank: HAND_RANKS.indexOf(best.name), name: best.name, description: best.description, score: best.score };
}

const HAND_RANKS = ['High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'];

// ─── Board Probability ────────────────────────────────────────────────────────
export interface BoardProbability {
  probability: number;
  totalPossible: number;
  oddsString: string;
  label: string;
  streetBreakdown: Array<{ street: string; probability: number; oddsString: string }>;
}

export function calculateBoardProbability(boardCards: Card[], knownHoleCards: Card[][]): BoardProbability {
  const knownCount = knownHoleCards.reduce((s, h) => s + h.filter(Boolean).length, 0);
  const remaining = 52 - knownCount;
  const n = boardCards.length;
  if (n === 0) {
    return { probability: 1, totalPossible: 1, oddsString: 'N/A', label: 'No cards dealt', streetBreakdown: [] };
  }
  const total = combCount(remaining, n);
  const prob = 1 / total;
  const streetLabels: Record<number, string> = { 3: 'Flop', 4: 'Turn', 5: 'River' };
  const label = streetLabels[n] ?? `${n}-card board`;
  const streetBreakdown: Array<{ street: string; probability: number; oddsString: string }> = [];
  let streetRemaining = remaining;
  if (n >= 3) {
    const flopTotal = combCount(streetRemaining, 3);
    streetBreakdown.push({ street: 'Flop (3 specific cards)', probability: 1 / flopTotal, oddsString: `1 in ${flopTotal.toLocaleString()}` });
    streetRemaining -= 3;
  }
  if (n >= 4) {
    streetBreakdown.push({ street: 'Turn (1 specific card)', probability: 1 / streetRemaining, oddsString: `1 in ${streetRemaining}` });
    streetRemaining -= 1;
  }
  if (n >= 5) {
    streetBreakdown.push({ street: 'River (1 specific card)', probability: 1 / streetRemaining, oddsString: `1 in ${streetRemaining}` });
  }
  return { probability: prob, totalPossible: total, oddsString: `1 in ${total.toLocaleString()}`, label, streetBreakdown };
}

// ─── Monte Carlo Win Probabilities ───────────────────────────────────────────
export interface WinOdds {
  winPct: number;
  tiePct: number;
  losePct: number;
}

export function calculateWinOdds(boardCards: Card[], playerHands: Array<[Card | null, Card | null]>, simulations = 6000): WinOdds[] {
  const validPlayers = playerHands.map((h, i) => ({ hand: h, idx: i })).filter(p => p.hand[0] && p.hand[1]);
  const n = validPlayers.length;
  if (n < 2) return playerHands.map(() => ({ winPct: 0, tiePct: 0, losePct: 100 }));
  const known = new Set<Card>([...boardCards, ...validPlayers.flatMap(p => p.hand.filter(Boolean) as Card[])]);
  const deck = getAllCards().filter(c => !known.has(c));
  const needed = 5 - boardCards.length;
  const wins = new Array(n).fill(0);
  const ties = new Array(n).fill(0);
  for (let sim = 0; sim < simulations; sim++) {
    for (let i = 0; i < needed; i++) {
      const j = i + Math.floor(Math.random() * (deck.length - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const simBoard = [...boardCards, ...deck.slice(0, needed)];
    const scores = validPlayers.map(p => evaluateBestHand(p.hand, simBoard).score);
    const maxScore = Math.max(...scores);
    const numWinners = scores.filter(s => s === maxScore).length;
    if (numWinners > 1) {
      scores.forEach((s, i) => { if (s === maxScore) ties[i]++; });
    } else {
      wins[scores.indexOf(maxScore)]++;
    }
  }
  const result: WinOdds[] = playerHands.map(() => ({ winPct: 0, tiePct: 0, losePct: 100 }));
  validPlayers.forEach((p, vi) => {
    const win = wins[vi] / simulations;
    const tie = ties[vi] / simulations;
    result[p.idx] = { winPct: win * 100, tiePct: tie * 100, losePct: (1 - win - tie) * 100 };
  });
  return result;
}

// ─── Outs Calculator ─────────────────────────────────────────────────────────
export interface OutsResult {
  count: number;
  improvedHands: string[];
  turnOdds: string;
  riverOdds: string;
}

export function calculateOuts(holeCards: [Card | null, Card | null], boardCards: Card[]): OutsResult | null {
  const hole = holeCards.filter(Boolean) as Card[];
  if (hole.length < 2 || boardCards.length < 3 || boardCards.length > 4) return null;
  const known = new Set<Card>([...hole, ...boardCards]);
  const unknown = getAllCards().filter(c => !known.has(c));
  const current = evaluateBestHand(hole, boardCards);
  const improved = new Set<string>();
  let outCount = 0;
  for (const card of unknown) {
    const newHand = evaluateBestHand(hole, [...boardCards, card]);
    if (newHand.score > current.score) { outCount++; improved.add(newHand.name); }
  }
  const cardsUnseen = unknown.length;
  const turnPct = (outCount / cardsUnseen) * 100;
  const riverCalc = (1 - Math.pow((cardsUnseen - outCount) / cardsUnseen, 2)) * 100;
  return {
    count: outCount,
    improvedHands: [...improved],
    turnOdds: `${turnPct.toFixed(1)}%`,
    riverOdds: boardCards.length === 3 ? `~${riverCalc < 99 ? riverCalc.toFixed(1) : '99.9'}%` : `${turnPct.toFixed(1)}%`,
  };
}

// ─── Pot Odds ─────────────────────────────────────────────────────────────────
export function calculatePotOdds(potSize: number, callAmount: number) {
  if (callAmount <= 0 || potSize <= 0) return null;
  const totalPot = potSize + callAmount;
  const pct = (callAmount / totalPot) * 100;
  const ratio = potSize / callAmount;
  return { percentage: pct, ratio, ratioString: `${ratio.toFixed(1)}:1`, breakEven: `${pct.toFixed(1)}% equity to break even` };
}