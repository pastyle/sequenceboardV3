import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useGameState } from './hooks/useGameState';
import { Board } from './components/Board';
import { PlayerHand } from './components/PlayerHand';
import { GameHeader } from './ui/GameHeader';
import { PlayerList, TEAM_COLORS } from './ui/PlayerList';
import { useAuth } from './hooks/useAuth';
import { useGameConnection } from './hooks/useGameConnection';
import { LobbyScreen } from './components/lobby/LobbyScreen';
import { WaitingRoom } from './components/lobby/WaitingRoom';
import { TurnNotification } from './ui/TurnNotification';

// Game Route Wrapper to handle logic
const GameRoute = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, signIn, loading: authLoading } = useAuth();
  const {
    game,
    leaveGame,
    startGame,
    loading: gameLoading,
    error
  } = useGameConnection(code || null);

  // Ensure auth
  useEffect(() => {
    if (!user && !authLoading) {
      signIn();
    }
  }, [user, authLoading, signIn]);

  // Handle joining via URL if not already connected
  useEffect(() => {
    if (code && !gameLoading && !game && !error && user) {
      console.log("Game not found or failed to load. Redirecting to home.");
      navigate('/');
    }
  }, [code, game, gameLoading, error, navigate, user]);

  // Game UI Logic
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { state, handleCardClick, handleBoardClick, handleDiscard, canDiscard, resetGame, turnError, localPlayer, isMyTurn } = useGameState(game, user?.uid);

  // Toast Logic
  const [toastMessage, setToastMessage] = useState<{ msg: string, type: 'info' | 'error' } | null>(null);
  const prevPlayersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (!state?.players) return;

    Object.values(state.players).forEach((p: any) => {
      const prev = prevPlayersRef.current[p.uid];
      // Check if went offline
      if (prev && prev.connectionStatus === 'online' && p.connectionStatus === 'offline') {
        // Only notify if we knew this player before (avoid init noise)
        setToastMessage({ msg: `${p.name} desconectou. O BOT assumirá em breve.`, type: 'error' });
        setTimeout(() => setToastMessage(null), 5000);
      }
      // Check if came online
      if (prev && prev.connectionStatus === 'offline' && p.connectionStatus === 'online') {
        const wasBot = prev.isBot;
        // If it was a bot and now user is back
        const msg = wasBot ? `${p.name} reconectou! Bot desativado.` : `${p.name} reconectou!`;
        setToastMessage({ msg, type: 'info' });
        setTimeout(() => setToastMessage(null), 3000);
      }
    });
    prevPlayersRef.current = state.players;
  }, [state?.players]);

  if (authLoading || gameLoading) {
    return <div className="min-h-screen bg-bg-dark text-white flex items-center justify-center">Loading...</div>;
  }

  if (!game) return null; // Will redirect

  if (game.status === 'waiting') {
    return (
      <WaitingRoom
        game={game}
        currentUser={user}
        onStartGame={startGame}
        onLeaveGame={() => {
          leaveGame(game.roomId, user?.uid || '');
          navigate('/');
        }}
        loading={gameLoading}
      />
    );
  }

  // Active Game UI
  // Active Game UI
  const currentPlayer = state.players[state.currentPlayerIndex];

  // Winner Display Logic:
  // If 2v2 (4 players), show Team Name (Red/Blue).
  // If 2 or 3 players, show Player Name.
  let winnerText = '';
  if (state.winner) {
    if (state.players.length === 4) {
      winnerText = `${state.winner.toUpperCase()} TEAM WINS!`;
    } else {
      // Find player(s) who won - wait, winner is Team. So we need to map back if 1v1.
      // Actually for 1v1, Team Red is Player 1.
      // For 3 players, Team Green is Player 3.
      // So we can look for players in that team.
      const winningPlayers = state.players.filter(p => p.team === state.winner);
      if (winningPlayers.length === 1) {
        winnerText = `${winningPlayers[0].name} Wins!`;
      } else {
        winnerText = `${state.winner.toUpperCase()} TEAM WINS!`;
      }
    }
  }

  const statusText = winnerText || (isMyTurn ? "YOUR TURN" : `${currentPlayer.name}'s Turn`);

  return (
    <div className="flex flex-col h-screen w-full bg-bg-dark text-text-primary font-outfit overflow-hidden">
      <GameHeader
        status={statusText}
        winner={state.winner}
        onReset={resetGame}
        isMyTurn={isMyTurn}
        roomId={game?.roomId}
      />

      {/* Turn Error Toast */}
      {turnError && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl font-bold text-xl animate-bounce">
          {turnError}
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-xl z-[200] font-bold text-white animate-in slide-in-from-top-4 fade-in ${toastMessage.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
          }`}>
          {toastMessage.msg}
        </div>
      )}

      {/* Turn Notification Banner */}
      <TurnNotification
        isMyTurn={isMyTurn}
        playerName={localPlayer?.name}
        teamColor={localPlayer?.team ? TEAM_COLORS[localPlayer.team] : undefined}
        winner={state.winner}
        winnerText={winnerText}
        localPlayerTeam={localPlayer?.team}
        isHost={localPlayer?.isHost}
        onRestart={resetGame}
      />

      <main className="flex flex-1 overflow-hidden relative">
        <PlayerList
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          deckCount={state.deck.length}
          localPlayerUid={user?.uid}
        />

        <section className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <Board
            board={state.board}
            currentPlayer={currentPlayer}
            selectedCard={localPlayer && state.selectedCardIndex !== -1 ? localPlayer.hand[state.selectedCardIndex] : null}
            previewCard={hoveredCard}
            lastMove={game?.lastMove}
            winningCells={state.winningCells}
            onCellClick={handleBoardClick}
          />
        </section>

        {localPlayer && (
          <PlayerHand
            hand={localPlayer.hand}
            selectedCardIndex={state.selectedCardIndex}
            onCardClick={handleCardClick}
            canDiscard={canDiscard}
            onDiscard={handleDiscard}
            turnStartedAt={game?.turnStartedAt}
            isMyTurn={isMyTurn}
            onCardHover={setHoveredCard}
            gameOver={!!state.winner}
          />
        )}
      </main>
    </div>
  );
};

// Main App Component with Router
import { LanguageProvider } from './i18n/LanguageContext';

function App() {
  const { user, signIn, loading } = useAuth();
  const { createGame, joinGame } = useGameConnection();

  // Auto-login anonymously on app load
  useEffect(() => {
    if (!user && !loading) signIn();
  }, [user, loading, signIn]);

  const MainLobby = () => {
    const navigate = useNavigate();

    const handleCreate = async (name: string, maxPlayers: number) => {
      if (!user) return;
      const code = await createGame(user.uid, name, maxPlayers);
      navigate(`/game/${code}`);
    };

    const handleJoin = async (code: string, name: string) => {
      if (!user) return;
      await joinGame(code, user.uid, name);
      navigate(`/game/${code}`);
    };

    return (
      <LobbyScreen
        onCreateGame={handleCreate}
        onJoinGame={handleJoin}
        loading={false} // Loading state handled inside hooks mostly
      />
    );
  };

  if (loading) return <div className="text-white bg-bg-dark h-screen flex items-center justify-center">Authenticating...</div>;

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLobby />} />
          <Route path="/game/:code" element={<GameRoute />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
