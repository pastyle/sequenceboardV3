import { useEffect } from 'react';
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
  const { state, handleCardClick, handleBoardClick, resetGame, setupWinScenario, turnError, localPlayer, isMyTurn } = useGameState(game, user?.uid);

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
  const currentPlayer = state.players[state.currentPlayerIndex];
  const statusText = state.winner
    ? `GAME OVER! ${state.winner} Wins!`
    : `${currentPlayer.name}'s Turn`;

  return (
    <div className="flex flex-col h-screen w-full bg-bg-dark text-text-primary font-outfit overflow-hidden">
      <GameHeader
        status={statusText}
        winner={state.winner}
        onReset={resetGame}
        onDebugWin={setupWinScenario}
      />

      {/* Turn Error Toast */}
      {turnError && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl font-bold text-xl animate-bounce">
          {turnError}
        </div>
      )}

      {/* Turn Notification Banner */}
      <TurnNotification
        isMyTurn={isMyTurn}
        playerName={localPlayer?.name}
        teamColor={localPlayer?.team ? TEAM_COLORS[localPlayer.team] : undefined}
        winner={state.winner}
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
            winningCells={state.winningCells}
            onCellClick={handleBoardClick}
          />
        </section>

        {localPlayer && (
          <PlayerHand
            hand={localPlayer.hand}
            selectedCardIndex={state.selectedCardIndex}
            onCardClick={handleCardClick}
          />
        )}
      </main>
    </div>
  );
};

// Main App Component with Router
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLobby />} />
        <Route path="/game/:code" element={<GameRoute />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
