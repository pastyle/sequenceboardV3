import React, { useState } from 'react';
import { CreateGameModal } from './CreateGameModal';

interface LobbyScreenProps {
    onCreateGame: (name: string, maxPlayers: number) => void;
    onJoinGame: (code: string, name: string) => void;
    loading: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreateGame, onJoinGame, loading }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinName, setJoinName] = useState('');

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode && joinName) {
            onJoinGame(joinCode.toUpperCase(), joinName);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-bg-dark text-white p-4">
            <h1 className="text-6xl font-black mb-12 bg-gradient-to-r from-game-red to-game-blue bg-clip-text text-transparent">
                SEQUENCE
            </h1>

            <div className="w-full max-w-md space-y-8">
                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-colors"
                    >
                        Create New Game
                    </button>

                    {localStorage.getItem('lastGameRoomId') && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                            <div className="text-white/60 text-sm mb-2">Previous Game Found</div>
                            <button
                                onClick={() => {
                                    const code = localStorage.getItem('lastGameRoomId');
                                    const name = localStorage.getItem('lastPlayerName');

                                    if (code && name) {
                                        setJoinCode(code);
                                        setJoinName(name);
                                        onJoinGame(code, name);
                                    } else if (code) {
                                        setJoinCode(code);
                                    }
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <span>↺</span> Reconnect to {localStorage.getItem('lastGameRoomId')}
                            </button>
                        </div>
                    )}

                    <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                        <h2 className="text-xl font-bold mb-4 text-center">Join Existing Game</h2>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Your Name"
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 text-white"
                                required
                            />
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Room Code (6 chars)"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="flex-1 p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 uppercase font-mono text-white"
                                    maxLength={6}
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !joinCode || !joinName}
                                    className="bg-game-blue hover:bg-blue-600 px-6 py-3 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Joining...' : 'Join'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {showCreateModal && (
                <CreateGameModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={onCreateGame}
                    loading={loading}
                />
            )}
        </div>
    );
};
