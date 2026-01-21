import React, { useState } from 'react';
import { CreateGameModal } from './CreateGameModal';
import { useLanguage } from '../../i18n';
import { LobbyHeader } from './LobbyHeader';

interface LobbyScreenProps {
    onCreateGame: (name: string, maxPlayers: number) => void;
    onJoinGame: (code: string, name: string) => void;
    loading: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreateGame, onJoinGame, loading }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinName, setJoinName] = useState('');
    const { t } = useLanguage();

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (joinCode && joinName) {
            onJoinGame(joinCode.toUpperCase(), joinName);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-bg-dark text-white">
            <LobbyHeader />

            <div className="flex-1 flex flex-col items-center justify-center p-4">
                <h1 className="text-6xl font-black mb-12 bg-gradient-to-r from-game-red to-game-blue bg-clip-text text-transparent">
                    Sequenc.ia
                </h1>

                <div className="w-full max-w-md space-y-8">
                    {/* Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-colors"
                        >
                            {t.lobby_createGame}
                        </button>

                        {localStorage.getItem('lastGameRoomId') && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                <div className="text-white/60 text-sm mb-2">{t.lobby_previousGame}</div>
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
                                    <span>↺</span> {t.lobby_reconnect} {localStorage.getItem('lastGameRoomId')}
                                </button>
                            </div>
                        )}

                        <div className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                            <h2 className="text-xl font-bold mb-4 text-center">{t.lobby_joinGame}</h2>
                            <form onSubmit={handleJoin} className="space-y-4">
                                <input
                                    type="text"
                                    placeholder={t.lobby_enterName}
                                    value={joinName}
                                    onChange={(e) => setJoinName(e.target.value)}
                                    className="w-full p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 text-white"
                                    required
                                />
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder={t.lobby_roomCodePlaceholder}
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
                                        {loading ? t.lobby_joining : t.lobby_join}
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
        </div>
    );
};
