import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EnterOutlined,
  FrownOutlined,
  SyncOutlined,
  TrophyOutlined,
  UndoOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Alert, Button, Input, Tag } from 'antd';
import { gameReducer, loadGame, saveGame } from './game';
import { AVATAR_OPTIONS } from './avatars';
import type { Game, Player, ScoreEvent } from './types';

const BASE_URL = import.meta.env.BASE_URL;
const NAME_PREFIXES = [
  'Козырный', 'Шустрый', 'Сонный', 'Хитрый', 'Лютый', 'Бодрый', 'Карточный', 'Невезучий',
  'Тузовый', 'Бубновый', 'Пиковый', 'Червовый', 'Беспощадный', 'Усатый', 'Легендарный', 'Подозрительный',
  'Вечно голодный', 'Тихий', 'Плюшевый', 'Космический', 'Деловой', 'Пузатый', 'Загадочный', 'Счастливый',
  'Неуловимый', 'Королевский', 'Шепелявый', 'Танцующий', 'Уважаемый', 'Фартовый', 'Рассеянный', 'Великий',
];
const NAME_NOUNS = [
  'Барсук', 'Енот', 'Пингвин', 'Кролик', 'Хомяк', 'Лось', 'Карась', 'Валет',
  'Шулер', 'Котлетка', 'Капибара', 'Бобр', 'Сурикат', 'Кабачок', 'Тапок', 'Пельмень',
  'Джокер', 'Туз', 'Король', 'Блинчик', 'Бегемот', 'Филин', 'Носорог', 'Огурец',
  'Крокодил', 'Самовар', 'Кекс', 'Лемур', 'Вареник', 'Сом', 'Космонавт', 'Чемпион',
];

function avatarSrc(avatarId: string) {
  return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(avatarId)}&backgroundColor=transparent`;
}

function PixelAvatar({ avatarId, label }: { avatarId: string; label: string }) {
  return <img className="pixel-avatar" src={avatarSrc(avatarId)} alt={label} />;
}

function randomPlayerName(takenNames: string[]) {
  const taken = new Set(takenNames.map((name) => name.trim().toLocaleLowerCase()));
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const name = `${NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]} ${NAME_NOUNS[Math.floor(Math.random() * NAME_NOUNS.length)]}`;
    if (!taken.has(name.toLocaleLowerCase())) return name;
  }
  return `Игрок ${Math.floor(Math.random() * 1000) + 1}`;
}

function useSavedGame() {
  const [game, dispatch] = useReducer(gameReducer, undefined, loadGame);
  useEffect(() => saveGame(game), [game]);
  return { game, dispatch };
}

function App() {
  const { game, dispatch } = useSavedGame();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showHome, setShowHome] = useState(true);

  const beginNew = () => {
    if (game?.status === 'playing') {
      setDialogOpen(true);
      return;
    }
    dispatch({ type: 'start-new' });
    setShowHome(false);
  };

  const confirmNew = () => {
    dispatch({ type: 'start-new' });
    setShowHome(false);
    setDialogOpen(false);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      {showHome && <HomeScreen saved={game} onNewGame={beginNew} onContinue={() => setShowHome(false)} />}
      {!showHome && game?.status === 'setup' && (
        <SetupScreen game={game} dispatch={dispatch} onHome={() => setShowHome(true)} />
      )}
      {!showHome && game?.status === 'playing' && (
        <PlayingScreen game={game} dispatch={dispatch} onHome={() => setShowHome(true)} />
      )}
      {!showHome && game?.status === 'finished' && <ResultScreen game={game} dispatch={dispatch} onHome={() => setShowHome(true)} onPlayAgain={() => dispatch({ type: 'restart-same-players' })} />}

      <p className="save-note">Вы всегда можете закрыть страницу — данные сохраняются на устройстве.</p>

      {dialogOpen && (
        <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}>
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="new-game-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="new-game-dialog-title">Начать новую партию?</h2>
            <p>Текущая партия и ее история будут заменены.</p>
            <div className="confirm-dialog-actions">
              <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
              <Button type="primary" onClick={confirmNew}>Начать новую игру</Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function HomeScreen({ saved, onNewGame, onContinue }: { saved: Game | null; onNewGame: () => void; onContinue: () => void }) {
  return (
    <section className="home-screen page-width">
      <div className="hero-copy">
        <h1>Калькулятор<br/><span>для игры 101</span></h1>
        <p className="home-subtitle">Автоматический подсчет очков и история партии</p>
        <div className="home-actions">
          <Button type="primary" size="large" onClick={onNewGame}>Новая игра</Button>
          {saved && (
            <Button size="large" icon={<ClockCircleOutlined/>} onClick={onContinue}>
              {saved.status === 'setup' ? 'Продолжить настройку' : saved.status === 'finished' ? 'Посмотреть результат' : 'Продолжить игру'}
            </Button>
          )}
        </div>
      </div>
      <div className="hero-card-wrap" aria-hidden="true">
        <img className="hero-cards-image" src={`${BASE_URL}images/playing-cards.png`} alt="Стопка карт: сверху семёрка червей, под ней туз червей" />
        <div className="floating-score"><strong>Игрок №1</strong>
          <div className="history-block">
            <div className="history-title"><span>История счета</span></div>
            <ul className="history-list">
              <li className="history-item"><span className="history-delta positive">+22</span><span className="history-arrow">→</span><strong>22</strong></li>
              <li className="history-item"><span className="history-delta positive">+13</span><span className="history-arrow">→</span><strong>35</strong></li>
              <li className="history-item"><span className="history-delta positive">+32</span><span className="history-arrow">→</span><strong>67</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function SetupScreen({ game, dispatch, onHome }: { game: Game; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]>; onHome: () => void }) {
  const [avatarPickerPlayer, setAvatarPickerPlayer] = useState<Player | null>(null);
  const validNames = game.players.every((player) => player.name.trim());
  const filledNames = game.players.map((player) => player.name.trim().toLocaleLowerCase()).filter(Boolean);
  const uniqueNames = new Set(filledNames).size === filledNames.length;
  return (
    <section className="page-width content-page">
      <div className="game-heading setup-heading">
        <Button icon={<ArrowLeftOutlined />} onClick={onHome}>На главный экран</Button>
      </div>
      <div className="section-heading">
        <div><span className="eyebrow">Подготовка к игре</span><h1>Кто за столом?</h1></div>
        <div className="player-count">{game.players.length}<span> / 5</span></div>
      </div>
      <div className="setup-card">
        <div className="setup-list">
          {game.players.map((player, index) => (
            <div className={`setup-row ${game.players.length <= 2 ? 'setup-row-no-delete' : ''}`} key={player.id}>
              <button type="button" className="player-avatar avatar-picker-button" onClick={() => setAvatarPickerPlayer(player)} aria-label={`Выбрать аватар для ${player.name || `игрока ${index + 1}`}`} title="Выбрать аватар">
                <PixelAvatar avatarId={player.avatarId} label="" />
              </button>
              <Input
                size="large"
                value={player.name}
                maxLength={24}
                placeholder={`Имя игрока ${index + 1}`}
                onChange={(event) => dispatch({ type: 'set-player-name', id: player.id, name: event.target.value })}
                onPressEnter={(event) => event.currentTarget.blur()}
              />
              <Button
                type="text"
                icon={<SyncOutlined />}
                aria-label={`Сгенерировать имя для игрока ${index + 1}`}
                title="Сгенерировать случайное имя"
                onClick={() => dispatch({ type: 'set-player-name', id: player.id, name: randomPlayerName(game.players.filter((item) => item.id !== player.id).map((item) => item.name)) })}
              />
              {game.players.length > 2 && <Button type="text" danger icon={<DeleteOutlined />} aria-label={`Удалить ${player.name || `игрока ${index + 1}`}`} onClick={() => dispatch({ type: 'remove-player', id: player.id })} />}
            </div>
          ))}
        </div>
        <Button className="add-player-button" icon={<UserAddOutlined />} disabled={game.players.length >= 5} onClick={() => dispatch({ type: 'add-player' })}>Добавить игрока</Button>
        {!uniqueNames && <Alert type="warning" showIcon message="Имена игроков должны отличаться" />}
        <Button type="primary" size="large" block disabled={!validNames || !uniqueNames} icon={<CheckOutlined />} onClick={() => dispatch({ type: 'start-game' })}>Начать партию</Button>
      </div>
      <p className="helper-text">От 2 до 5 игроков. Имена и счет партии сохраняются автоматически.</p>
      {avatarPickerPlayer && (
        <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={() => setAvatarPickerPlayer(null)}>
          <section className="avatar-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="avatar-dialog-header">
              <h2 id="avatar-dialog-title">Выберите аватар</h2>
              <Button type="text" onClick={() => setAvatarPickerPlayer(null)} aria-label="Закрыть выбор аватара">×</Button>
            </div>
            <div className="avatar-options">
              {AVATAR_OPTIONS.map((avatarId) => (
                <button
                  type="button"
                  key={avatarId}
                  className={`avatar-option ${avatarPickerPlayer.avatarId === avatarId ? 'is-selected' : ''}`}
                  onClick={() => {
                    dispatch({ type: 'set-player-avatar', id: avatarPickerPlayer.id, avatarId });
                    setAvatarPickerPlayer(null);
                  }}
                  aria-label={`Выбрать аватар ${avatarId}`}
                >
                  <PixelAvatar avatarId={avatarId} label="" />
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function PlayingScreen({ game, dispatch, onHome }: { game: Game; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]>; onHome: () => void }) {
  const latestEvent = game.events.at(-1);
  return (
    <section className="page-width content-page">
      <div className="game-heading">
        <Button icon={<ArrowLeftOutlined />} onClick={onHome}>На главный экран</Button>
      </div>
      {latestEvent?.reset && <Alert className="game-alert" type="success" showIcon message={`${nameOf(game.players, latestEvent.playerId)} дошел до ${latestEvent.rawScore} очков – счет обнулен.`} />}
      <div className="score-grid">
        {game.players.map((player, index) => (
          <PlayerCard
            key={player.id}
            player={player}
            index={index}
            events={game.events.filter((event) => event.playerId === player.id)}
            disabled={game.status !== 'playing'}
            onAdd={(delta) => dispatch({ type: 'add-score', playerId: player.id, delta })}
            onUndo={(eventId) => dispatch({ type: 'undo-score', eventId })}
          />
        ))}
      </div>
    </section>
  );
}

function PlayerCard({ player, index, events, disabled, onAdd, onUndo }: { player: Player; index: number; events: ScoreEvent[]; disabled: boolean; onAdd: (delta: number) => void; onUndo: (eventId: string) => void }) {
  const [delta, setDelta] = useState('');
  const [error, setError] = useState('');
  const historyRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight });
  }, [events.length]);
  const submit = () => {
    const score = Number(delta);
    if (!delta || !Number.isSafeInteger(score) || score < 1) {
      setError('Введите целое положительное число.');
      return;
    }
    onAdd(score);
    setDelta('');
    setError('');
  };
  return (
    <article className="player-card">
      <div className="player-card-head">
        <span className="player-avatar"><PixelAvatar avatarId={player.avatarId} label={`Аватар игрока ${player.name}`} /></span>
        <strong>{player.name}</strong>
        <Tag bordered={false} className="round-tag">Игрок {index + 1}</Tag>
      </div>
      <div className={`score-value ${Math.abs(player.score) >= 80 ? 'score-warning' : ''}`}>{player.score}<span> очков</span></div>
      <div className="score-meter"><span style={{ width: `${Math.min(Math.abs(player.score), 101) / 101 * 100}%` }} /></div>
      {disabled ? <div className="loser-note"><TrophyOutlined /> Проиграл эту партию</div> : (
        <div className="score-entry">
          <label>Очки за раздачу</label>
          <div className="score-input-row">
            <Button size="large" className="score-penalty" onClick={() => onAdd(-20)}>−20</Button>
            <Button size="large" className="score-penalty" onClick={() => onAdd(-40)}>−40</Button>
            <span className="score-entry-divider" aria-hidden="true" />
            <div className="score-submit-group">
              <Input
                value={delta}
                onChange={(event) => {
                  const value = event.target.value;
                  if (/^[1-9]\d*$/.test(value) || value === '') {
                    setDelta(value);
                    setError('');
                  }
                }}
                onKeyDown={(event) => {
                  if ((event.key.length === 1 && !/\d/.test(event.key)) || (event.key === '0' && !delta)) event.preventDefault();
                }}
                onPaste={(event) => {
                  if (!/^\d+$/.test(event.clipboardData.getData('text'))) event.preventDefault();
                }}
                onPressEnter={submit}
                placeholder="Например, 22"
                type="text"
                inputMode="numeric"
                pattern="[1-9][0-9]*"
                size="large"
                className="score-input"
                aria-label={`Очки за раздачу для ${player.name}`}
              />
              <Button type="primary" size="large" className="score-submit-button" icon={<EnterOutlined />} onClick={submit} aria-label={`Записать очки для ${player.name}`} title="Записать очки (Enter)" />
            </div>
          </div>
          {error && <span className="input-error">{error}</span>}
        </div>
      )}
      <div className="history-block">
        <div className="history-title"><span>История счета</span><span>{events.length} {events.length === 1 ? 'запись' : 'записей'}</span></div>
        {events.length === 0 ? <div className="empty-history">Здесь появятся очки</div> : (
          <ul className="history-list" ref={historyRef}>
            {events.map((event) => <HistoryItem event={event} key={event.id} onUndo={() => onUndo(event.id)} />)}
          </ul>
        )}
      </div>
    </article>
  );
}

function HistoryItem({ event, onUndo }: { event: ScoreEvent; onUndo: () => void }) {
  return (
    <li className="history-item">
      <span className={`history-delta ${event.delta > 0 ? 'positive' : 'negative'}`}>{event.delta > 0 ? '+' : ''}{event.delta}</span>
      <span className="history-arrow">→</span>
      <strong>{event.scoreAfter}</strong>
      <span className="history-event">{event.reset ? 'обнуление' : ''}</span>
      <Button type="text" size="small" className="undo-score-button" icon={<UndoOutlined />} onClick={onUndo} aria-label={`Отменить изменение ${event.delta > 0 ? '+' : ''}${event.delta}`} title="Отменить изменение" />
    </li>
  );
}

function ResultScreen({ game, dispatch, onHome, onPlayAgain }: { game: Game; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]>; onHome: () => void; onPlayAgain: () => void }) {
  const loser = game.players.find((player) => player.id === game.loserId);
  const rankedPlayers = useMemo(() => game.players, [game.players]);
  return (
    <section className="page-width content-page result-page">
      <div className="game-heading">
        <Button icon={<ArrowLeftOutlined />} onClick={onHome}>На главный экран</Button>
      </div>
      <div className="result-banner">
        <div className="result-icon"><FrownOutlined /></div>
        <h1>{loser?.name ?? 'Игрок'} проигрывает</h1>
        <p>со счетом {loser?.score ?? '—'} очков</p>
        <div className="result-actions">
          <Button type="primary" size="large" onClick={onPlayAgain}>Играть тем же составом</Button>
        </div>
      </div>
      <div className="result-section-head"><h2>Итоги партии</h2></div>
      <div className="result-list">
        {rankedPlayers.map((player) => (
          <ResultPlayer key={player.id} player={player} events={game.events.filter((event) => event.playerId === player.id)} isLoser={player.id === game.loserId} onUndo={(eventId) => dispatch({ type: 'undo-score', eventId })} />
        ))}
      </div>
    </section>
  );
}

function ResultPlayer({ player, events, isLoser, onUndo }: { player: Player; events: ScoreEvent[]; isLoser: boolean; onUndo: (eventId: string) => void }) {
  return (
    <article className={`result-player ${isLoser ? 'is-loser' : ''}`}>
      <div className="result-player-top">
        <span className="player-avatar"><PixelAvatar avatarId={player.avatarId} label={`Аватар игрока ${player.name}`} /></span>
        <strong>{player.name}</strong>
        <div className="final-score">{player.score}<span> очков</span></div>
      </div>
      <div className="result-timeline">
        {events.length ? events.map((event, index) => (
          <span className={`timeline-step ${event.delta > 0 ? 'timeline-positive' : 'timeline-negative'} ${event.reset ? 'timeline-reset' : ''}`} title={`${event.delta > 0 ? '+' : ''}${event.delta} → ${event.scoreAfter}`} key={event.id}>
            {index + 1}. {event.delta > 0 ? '+' : ''}{event.delta}{event.reset ? ' ↺' : ''}
            <Button type="text" size="small" className="undo-score-button timeline-undo-button" icon={<UndoOutlined />} onClick={() => onUndo(event.id)} aria-label={`Отменить изменение ${event.delta > 0 ? '+' : ''}${event.delta}`} title="Отменить изменение" />
          </span>
        )) : <span className="empty-history">Без записей счета</span>}
      </div>
    </article>
  );
}

function nameOf(players: Player[], id: string) {
  return players.find((player) => player.id === id)?.name ?? 'Игрок';
}

export default App;
