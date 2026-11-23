import type { Game, GameAction, Player, ScoreEvent } from './types';
import { AVATAR_OPTIONS } from './avatars';

export const STORAGE_KEY = 'scorekeeper-101-game-v1';
const now = () => new Date().toISOString();
const newId = () => crypto.randomUUID();
const defaultAvatar = (index: number) => AVATAR_OPTIONS[index % AVATAR_OPTIONS.length];

export function createGame(playerNames: string[] = [], avatarIds?: string[]): Game {
  const timestamp = now();
  return {
    schemaVersion: 1,
    id: newId(),
    status: 'setup',
    players: (playerNames.length ? playerNames : ['', '']).map((name, index) => ({ id: newId(), name, score: 0, avatarId: avatarIds?.[index] ?? defaultAvatar(index) })),
    events: [],
    loserId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isGame(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return normalizeGame(parsed);
  } catch {
    return null;
  }
}

export function saveGame(game: Game | null): void {
  try {
    if (game) localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The game remains usable in memory if browser storage is unavailable.
  }
}

function isGame(value: unknown): value is Game {
  if (!value || typeof value !== 'object') return false;
  const game = value as Partial<Game>;
  return game.schemaVersion === 1
    && ['setup', 'playing', 'finished'].includes(String(game.status))
    && Array.isArray(game.players)
    && Array.isArray(game.events)
    && typeof game.id === 'string'
    && (game.loserId === null || typeof game.loserId === 'string');
}

function normalizeGame(game: Game): Game {
  return {
    ...game,
    players: game.players.map((player, index) => ({ ...player, avatarId: typeof player.avatarId === 'string' ? player.avatarId : defaultAvatar(index) })),
  };
}

function updated(game: Game, changes: Partial<Game>): Game {
  return { ...game, ...changes, updatedAt: now() };
}

function replayEvents(events: ScoreEvent[], players: Player[]) {
  const scores = new Map(players.map((player) => [player.id, 0]));
  let loserId: string | null = null;

  const recalculatedEvents = events.map((event) => {
    const scoreBefore = scores.get(event.playerId) ?? 0;
    const rawScore = scoreBefore + event.delta;
    const reset = rawScore === 101 || rawScore === -101;
    const scoreAfter = reset ? 0 : rawScore;
    if (!loserId && (rawScore > 101 || rawScore < -101)) loserId = event.playerId;
    scores.set(event.playerId, scoreAfter);
    return { ...event, scoreBefore, rawScore, scoreAfter, reset };
  });

  return {
    events: recalculatedEvents,
    players: players.map((player) => ({ ...player, score: scores.get(player.id) ?? 0 })),
    status: loserId ? 'finished' as const : 'playing' as const,
    loserId,
  };
}

export function gameReducer(game: Game | null, action: GameAction): Game | null {
  switch (action.type) {
    case 'start-new':
      return createGame();
    case 'restart-same-players': {
      if (!game) return game;
      return { ...createGame(game.players.map((player) => player.name), game.players.map((player) => player.avatarId)), status: 'playing' };
    }
    case 'resume':
      return game;
    case 'clear':
      return null;
    case 'set-player-name':
      if (!game || game.status !== 'setup') return game;
      return updated(game, {
        players: game.players.map((player) => player.id === action.id
          ? { ...player, name: action.name }
          : player),
      });
    case 'set-player-avatar':
      if (!game || game.status !== 'setup') return game;
      return updated(game, {
        players: game.players.map((player) => player.id === action.id ? { ...player, avatarId: action.avatarId } : player),
      });
    case 'add-player': {
      if (!game || game.status !== 'setup' || game.players.length >= 5) return game;
      const player: Player = { id: newId(), name: '', score: 0, avatarId: defaultAvatar(game.players.length) };
      return updated(game, { players: [...game.players, player] });
    }
    case 'remove-player':
      if (!game || game.status !== 'setup' || game.players.length <= 2) return game;
      return updated(game, { players: game.players.filter((player) => player.id !== action.id) });
    case 'start-game':
      if (!game || game.status !== 'setup') return game;
      return updated(game, { status: 'playing' });
    case 'add-score': {
      if (!game || game.status !== 'playing' || !Number.isSafeInteger(action.delta) || action.delta === 0) return game;
      const player = game.players.find((item) => item.id === action.playerId);
      if (!player) return game;

      const rawScore = player.score + action.delta;
      const reset = rawScore === 101 || rawScore === -101;
      const lost = rawScore > 101 || rawScore < -101;
      const scoreAfter = reset ? 0 : rawScore;
      const event = {
        id: newId(),
        playerId: player.id,
        delta: action.delta,
        scoreBefore: player.score,
        rawScore,
        scoreAfter,
        reset,
        createdAt: now(),
      };
      return updated(game, {
        status: lost ? 'finished' : game.status,
        loserId: lost ? player.id : game.loserId,
        players: game.players.map((item) => item.id === player.id ? { ...item, score: scoreAfter } : item),
        events: [...game.events, event],
      });
    }
    case 'undo-score': {
      if (!game || !game.events.some((event) => event.id === action.eventId)) return game;
      return updated(game, replayEvents(game.events.filter((event) => event.id !== action.eventId), game.players));
    }
    default:
      return game;
  }
}
