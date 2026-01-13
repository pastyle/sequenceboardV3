import React from 'react';
import type { FirestoreGame } from '../../types/firebase';
import type { User } from 'firebase/auth';

interface WaitingRoomProps {
    game: FirestoreGame;
    currentUser: User | null;
    onStartGame: () => void;
    onLeaveGame: () => void;
    loading?: boolean;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
    game,
    currentUser,
    onStartGame,
    onLeaveGame,
    loading
}) => {
    const players = Object.values(game.players);
    const isHost = game.players[currentUser?.uid || '']?.isHost;
    // Constraint: Must match exact maxPlayers to start (for teams balance)
    const isReady = players.length === game.maxPlayers;

    const copyCode = () => {
        navigator.clipboard.writeText(game.roomId);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark text-white p-4">
            <div className="bg-white/5 p-8 rounded-2xl backdrop-blur-md w-full max-w-2xl border border-white/10">
                <div className="text-center mb-8">
                    <h2 className="text-sm uppercase tracking-widest text-white/50 mb-2">Room Code</h2>
                    <button
                        onClick={copyCode}
                        className="text-6xl font-mono font-bold bg-white/10 px-6 py-2 rounded-xl hover:bg-white/20 transition-colors cursor-pointer active:scale-95"
                        title="Click to Copy"
                    >
                        {game.roomId}
                    </button>
                    <p className="mt-4 text-xl">Waiting for players... ({players.length}/{game.maxPlayers})</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {players.map((player) => (
                        <div key={player.uid} className="bg-white/10 p-4 rounded-lg flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${player.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                            <div className="flex-1">
                                <p className="font-bold text-lg">{player.name} {player.uid === currentUser?.uid && '(You)'}</p>
                                {player.isHost && <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">HOST</span>}
                            </div>
                        </div>
                    ))}
                    {/* Placeholders */}
                    {Array.from({ length: game.maxPlayers - players.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-white/5 p-4 rounded-lg flex items-center justify-center border border-dashed border-white/20 text-white/30">
                            Waiting...
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <button
                        onClick={onLeaveGame}
                        className="text-red-400 hover:text-red-300 font-bold px-4 py-2"
                    >
                        Leave Room
                    </button>

                    {isHost && (
                        <button
                            onClick={onStartGame}
                            disabled={!isReady || loading}
                            className="bg-green-600 hover:bg-green-500 text-white text-lg font-bold px-8 py-3 rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105"
                        >
                            {loading ? 'Starting...' : 'Start Game'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
