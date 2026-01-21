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
import { LanguageProvider } from './i18n/LanguageContext';

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

    // --- Minus Card Notification Logic (Moved to Top) ---
    const [alertInfo, setAlertInfo] = useState<{ title: string; message: string } | null>(null);
    const lastProcessedMoveRef = useRef<string | null>(null);

    useEffect(() => {
        if (!game?.lastMove) return;

        // Create a unique ID for this move to avoid re-triggering on re-renders
        const moveId = `${game.lastMove.playerId}-${game.lastMove.position.r}-${game.lastMove.position.c}-${game.lastMove.type}`;

        if (game.lastMove.type === 'remove' && lastProcessedMoveRef.current !== moveId) {
            lastProcessedMoveRef.current = moveId;

            // 1. Play Sound
            const audio = new Audio('/sounds/notification-card-minus.mp3');
            audio.volume = 0.6;
            audio.play().catch(e => console.error("Error playing remove sound:", e));

            // 2. Determine Player Name
            const actingPlayer = game.players[game.lastMove.playerId];
            const actingName = actingPlayer ? actingPlayer.name : 'Unknown Player';

            // 3. Coordinate Label
            const rowLabel = String.fromCharCode(65 + game.lastMove.position.r);
            const colLabel = (game.lastMove.position.c + 1).toString();
            const coordLabel = `${rowLabel}${colLabel}`;

            // 4. Show Alert Modal
            setAlertInfo({
                title: 'Token Removed!',
                message: `${actingName} removed the token at ${coordLabel}.`
            });
        }
    }, [game?.lastMove, game?.players]);
    // --- End Minus Card Logic ---

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
        <div className="flex flex-col h-screen w-full bg-bg-dark text-text-primary font-outfit overflow-hidden relative">
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

            {/* Alert Box Modal (Reusable style) */}
            {alertInfo && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-bg-panel border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md text-center transform scale-100 animate-in zoom-in-95 duration-200">
                        <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-wide drop-shadow-md">
                            ⚠️ {alertInfo.title}
                        </h2>
                        <div className="w-16 h-1 bg-red-500 mx-auto rounded-full mb-6" />

                        <p className="text-xl text-white/90 font-medium mb-8 leading-relaxed">
                            {alertInfo.message}
                        </p>

                        <button
                            onClick={() => setAlertInfo(null)}
                            className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/40 font-bold px-8 py-3 rounded-full transition-all hover:scale-105 active:scale-95"
                        >
                            CLOSE
                        </button>
                    </div>
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

// Extracted MainLobby to prevent re-renders
const MainLobbyWrapper = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { createGame, joinGame } = useGameConnection();

    const handleCreate = async (name: string, maxPlayers: number, isPrivate: boolean, password?: string) => {
        if (!user) return;
        const code = await createGame(user.uid, name, maxPlayers, isPrivate, password);
        navigate(`/game/${code}`);
    };

    const handleJoin = async (code: string, name: string, password?: string) => {
        if (!user) return;
        await joinGame(code, user.uid, name, password);
        navigate(`/game/${code}`);
    };

    return (
        <LobbyScreen
            onCreateGame={handleCreate}
            onJoinGame={handleJoin}
            loading={false}
        />
    );
};

function App() {
    const { user, signIn, loading } = useAuth();

    // Auto-login anonymously on app load
    useEffect(() => {
        if (!user && !loading) signIn();
    }, [user, loading, signIn]);

    if (loading) return <div className="text-white bg-bg-dark h-screen flex items-center justify-center">Authenticating...</div>;

    return (
        <LanguageProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainLobbyWrapper />} />
                    <Route path="/game/:code" element={<GameRoute />} />
                </Routes>
            </BrowserRouter>
        </LanguageProvider>
    );
}

export default App;
