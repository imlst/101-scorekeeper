import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FrownOutlined,
  PlusOutlined,
  ReloadOutlined,
  TrophyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Alert, Button, Input, InputNumber, Modal, Tag } from 'antd';
import { gameReducer, loadGame, saveGame } from './game';
import type { Game, Player, ScoreEvent } from './types';

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
    if (game && game.status !== 'finished') {
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
        <PlayingScreen game={game} dispatch={dispatch} onNewGame={beginNew} />
      )}
      {!showHome && game?.status === 'finished' && <ResultScreen game={game} onNewGame={beginNew} />}

      <Modal
        open={dialogOpen}
        title="Начать новую партию?"
        okText="Сбросить и начать"
        cancelText="Остаться в партии"
        onOk={confirmNew}
        onCancel={() => setDialogOpen(false)}
        centered
      >
        <p>Текущая партия и ее история будут заменены.</p>
      </Modal>
    </main>
  );
}

function HomeScreen({ saved, onNewGame, onContinue }: { saved: Game | null; onNewGame: () => void; onContinue: () => void }) {
  return (
    <section className="home-screen page-width">
      <div className="hero-copy">
        <h1>Калькулятор<br/><span>Для карточной игры 101</span></h1>
        <span className="eyebrow"><span className="eyebrow-dot"/> Счет под контролем</span>
        <p>Автоматический подсчет очков и история партии. Данные сохраняются на устройстве.</p>
        <div className="home-actions">
          <Button type="primary" size="large" icon={<PlusOutlined/>} onClick={onNewGame}>Новая игра</Button>
          {saved && (
            <Button size="large" icon={<ClockCircleOutlined/>} onClick={onContinue}>
              {saved.status === 'setup' ? 'Продолжить настройку' : saved.status === 'finished' ? 'Посмотреть результат' : 'Продолжить игру'}
            </Button>
          )}
        </div>
      </div>
      <div className="hero-card-wrap" aria-hidden="true">
        <div className="hero-card card-back">♠</div>
        <div className="hero-card card-front"><span className="card-corner">A<br />♥</span><span className="heart">♥</span><span className="card-bottom">A<br />♥</span></div>
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
      <div className="rules-note"><div><strong>Правила игры</strong><p>После каждой раздачи к счету игрока прибавляется сумма оставшихся карт. Сумма может быть отрицательной, если игрок вышел дамой. При достижении 101 или -101 очков счет игрока обнуляется. А получив более 101 или менее -101 очков игрок проигрывает.</p></div></div>
    </section>
  );
}

function SetupScreen({ game, dispatch, onHome }: { game: Game; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]>; onHome: () => void }) {
  const validNames = game.players.every((player) => player.name.trim());
  const filledNames = game.players.map((player) => player.name.trim().toLocaleLowerCase()).filter(Boolean);
  const uniqueNames = new Set(filledNames).size === filledNames.length;
  return (
    <section className="page-width content-page">
      <button className="back-link" onClick={onHome}><ArrowLeftOutlined /> К началу</button>
      <div className="section-heading">
        <div><span className="eyebrow">Подготовка к игре</span><h1>Кто за столом?</h1></div>
        <div className="player-count">{game.players.length}<span> / 5</span></div>
      </div>
      <div className="setup-card">
        <div className="setup-list">
          {game.players.map((player, index) => (
            <div className="setup-row" key={player.id}>
              <span className={`player-avatar avatar-${index}`}>{player.name.trim().slice(0, 1).toUpperCase() || String(index + 1)}</span>
              <Input
                size="large"
                value={player.name}
                maxLength={24}
                placeholder={`Имя игрока ${index + 1}`}
                onChange={(event) => dispatch({ type: 'set-player-name', id: player.id, name: event.target.value })}
                onPressEnter={(event) => event.currentTarget.blur()}
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
    </section>
  );
}

function PlayingScreen({ game, dispatch, onNewGame }: { game: Game; dispatch: React.Dispatch<Parameters<typeof gameReducer>[1]>; onNewGame: () => void }) {
  const latestEvent = game.events.at(-1);
  return (
    <section className="page-width content-page">
      <div className="game-heading">
        <Button icon={<ReloadOutlined />} onClick={onNewGame}>Новая игра</Button>
      </div>
      {latestEvent?.reset && <Alert className="game-alert" type="success" showIcon message={`${nameOf(game.players, latestEvent.playerId)} дошел до ${latestEvent.rawScore} очков – счет обнулен.`} />}
      <div className="score-grid">
        {game.players.map((player, index) => (
          <PlayerCard key={player.id} player={player} index={index} events={game.events.filter((event) => event.playerId === player.id)} disabled={game.status !== 'playing'} onAdd={(delta) => dispatch({ type: 'add-score', playerId: player.id, delta })} />
        ))}
      </div>
    </section>
  );
}

function PlayerCard({ player, index, events, disabled, onAdd }: { player: Player; index: number; events: ScoreEvent[]; disabled: boolean; onAdd: (delta: number) => void }) {
  const [delta, setDelta] = useState<number | null>(null);
  const [error, setError] = useState('');
  const historyRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight });
  }, [events.length]);
  const submit = () => {
    if (delta === null || delta === 0 || !Number.isSafeInteger(delta)) {
      setError('Введите целое число, кроме нуля.');
      return;
    }
    onAdd(delta);
    setDelta(null);
    setError('');
  };
  return (
    <article className="player-card">
      <div className="player-card-head">
        <span className={`player-avatar avatar-${index}`}>{player.name.slice(0, 1).toUpperCase()}</span>
        <strong>{player.name}</strong>
        <Tag bordered={false} className="round-tag">Игрок {index + 1}</Tag>
      </div>
      <div className={`score-value ${Math.abs(player.score) >= 80 ? 'score-warning' : ''}`}>{player.score}<span> очков</span></div>
      <div className="score-meter"><span style={{ width: `${Math.min(Math.abs(player.score), 101) / 101 * 100}%` }} /></div>
      {disabled ? <div className="loser-note"><TrophyOutlined /> Проиграл эту партию</div> : (
        <div className="score-entry">
          <label>Очки за раздачу</label>
          <div className="score-input-row">
            <InputNumber
              value={delta}
              onChange={(value) => { setDelta(value); setError(''); }}
              onPressEnter={submit}
              placeholder="Например, 12 или −20"
              controls={false}
              precision={0}
              size="large"
              className="score-input"
              aria-label={`Очки за раздачу для ${player.name}`}
            />
            <Button type="primary" size="large" onClick={submit}>Записать</Button>
          </div>
          {error && <span className="input-error">{error}</span>}
        </div>
      )}
      <div className="history-block">
        <div className="history-title"><span>История счета</span><span>{events.length} {events.length === 1 ? 'запись' : 'записей'}</span></div>
        {events.length === 0 ? <div className="empty-history">Здесь появятся очки</div> : (
          <ul className="history-list" ref={historyRef}>
            {events.map((event) => <HistoryItem event={event} key={event.id} />)}
          </ul>
        )}
      </div>
    </article>
  );
}

function HistoryItem({ event }: { event: ScoreEvent }) {
  return (
    <li className="history-item">
      <span className={`history-delta ${event.delta > 0 ? 'positive' : 'negative'}`}>{event.delta > 0 ? '+' : ''}{event.delta}</span>
      <span className="history-arrow">→</span>
      <strong>{event.scoreAfter}</strong>
      <span className="history-event">{event.reset ? 'обнуление' : ''}</span>
    </li>
  );
}

function ResultScreen({ game, onNewGame }: { game: Game; onNewGame: () => void }) {
  const loser = game.players.find((player) => player.id === game.loserId);
  const rankedPlayers = useMemo(() => game.players, [game.players]);
  return (
    <section className="page-width content-page result-page">
      <div className="result-banner">
        <div className="result-icon"><FrownOutlined /></div>
        <span className="eyebrow">Партия завершена</span>
        <h1>{loser?.name ?? 'Игрок'} проиграл(а)</h1>
        <p>набрав {loser?.score ?? '—'} очков</p>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onNewGame}>Начать новую игру</Button>
      </div>
      <div className="result-section-head"><div><span className="eyebrow">Финальная таблица</span><h2>Итоги партии</h2></div><span className="result-rounds">{game.events.length} записей счета</span></div>
      <div className="result-list">
        {rankedPlayers.map((player, index) => (
          <ResultPlayer key={player.id} player={player} position={index + 1} events={game.events.filter((event) => event.playerId === player.id)} isLoser={player.id === game.loserId} />
        ))}
      </div>
    </section>
  );
}

function ResultPlayer({ player, position, events, isLoser }: { player: Player; position: number; events: ScoreEvent[]; isLoser: boolean }) {
  return (
    <article className={`result-player ${isLoser ? 'is-loser' : ''}`}>
      <div className="result-player-top">
        <span className={`player-avatar avatar-${position - 1}`}>{player.name.slice(0, 1).toUpperCase()}</span>
        <strong>{player.name}</strong>
        <div className="final-score">{player.score}<span> очков</span></div>
      </div>
      <div className="result-timeline">
        {events.length ? events.map((event, index) => (
          <span className={`timeline-step ${event.reset ? 'timeline-reset' : ''}`} title={`${event.delta > 0 ? '+' : ''}${event.delta} → ${event.scoreAfter}`} key={event.id}>
            {index + 1}. {event.delta > 0 ? '+' : ''}{event.delta}{event.reset ? ' ↺' : ''}
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
