export type Team = {
  id: string;
  name: string;
  color: string;
};

export type GameSettings = {
  teams: Team[];
  totalRounds: number;
  turnDurationSeconds: number;
  selectedCategoryIds: string[];
};

export type TurnResult = {
  teamId: string;
  correct: number;
  skipped: number;
  words: { word: string; result: 'correct' | 'skipped' | 'unanswered' }[];
};

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  CategorySelect: { settings: Omit<GameSettings, 'selectedCategoryIds'> };
  Ready: { settings: GameSettings; currentRound: number; currentTeamIndex: number; scores: Record<string, number> };
  Game: { settings: GameSettings; currentRound: number; currentTeamIndex: number; scores: Record<string, number> };
  TurnResult: { result: TurnResult; settings: GameSettings; currentRound: number; currentTeamIndex: number; scores: Record<string, number> };
  FinalScore: { settings: GameSettings; scores: Record<string, number> };
};
