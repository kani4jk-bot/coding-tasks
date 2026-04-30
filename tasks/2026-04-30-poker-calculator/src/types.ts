export type Suit = 'h' | 'd' | 'c' | 's';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Card = string; // e.g. "Ah", "Kd", "2c", "Ts"

export interface Player {
  id: string;
  name: string;
  cards: [Card | null, Card | null];
}

export interface HandResult {
  rank: number;
  name: string;
  description: string;
  score: number;
}

export interface OddsResult {
  boardProbability: number;
  boardOddsString: string;
  boardDescription: string;
  playerResults: Array<{
    handResult: HandResult;
    winProbability: number;
    tieProbability: number;
  }>;
  outs?: { count: number; improvedHands: string[] };
}