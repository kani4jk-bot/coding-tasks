import type { Team } from '../types';

export function rankTeams(teams: Team[], scores: Record<string, number>): Team[] {
  return [...teams].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
