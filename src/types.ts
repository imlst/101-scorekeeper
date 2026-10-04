export type GameStatus = 'setup' | 'playing' | 'finished';

export interface ScoreEvent {
  id: string;
  playerId: string;
  delta: number;
  scoreBefore: number;
  rawScore: number;
  scoreAfter: number;
  reset: boolean;
  createdAt: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface Game {
  schemaVersion: 1;
  id: string;
  status: GameStatus;
  players: Player[];
  events: ScoreEvent[];
  loserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GameAction =
  | { type: 'start-new' }
  | { type: 'resume' }
  | { type: 'set-player-name'; id: string; name: string }
  | { type: 'add-player' }
  | { type: 'remove-player'; id: string }
  | { type: 'start-game' }
  | { type: 'add-score'; playerId: string; delta: number }
  | { type: 'clear' };
