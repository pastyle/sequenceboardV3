import React, { useState, useEffect } from 'react';
import { CreateGameModal } from './CreateGameModal';
import { RoomList } from './RoomList';
import { JoinGameModal } from './JoinGameModal';
import { useLanguage } from '../../i18n';
import { LobbyHeader } from './LobbyHeader';
import { deleteAllGames } from '../../services/game';
import type { FirestoreGame } from '../../types/firebase';

interface LobbyScreenProps {
    onCreateGame: (name: string, maxPlayers: number, isPrivate: boolean, password?: string) => void;
    onJoinGame: (code: string, name: string, password?: string) => void;
    loading: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({ onCreateGame, onJoinGame, loading }) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedJoinRoom, setSelectedJoinRoom] = useState<FirestoreGame | null>(null);
    const [joinCode, setJoinCode] = useState('');
    const [lastGameExists, setLastGameExists] = useState(false);
    const [checkingRoom, setCheckingRoom] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const { t } = useLanguage();

    // Check if the last game still exists
    useEffect(() => {
        const checkLastGame = async () => {
            const lastGameId = localStorage.getItem('lastGameRoomId');
            if (lastGameId) {
                const { gameExists } = await import('../../services/game');
                const exists = await gameExists(lastGameId);
                setLastGameExists(exists);

                // Clear localStorage if game doesn't exist
                if (!exists) {
                    localStorage.removeItem('lastGameRoomId');
                    localStorage.removeItem('lastPlayerName');
                }
            }
        };

        checkLastGame();
    }, []);



    return (
        <div className="min-h-screen flex flex-col bg-bg-dark text-white">
            <LobbyHeader />

            <div className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-7xl mx-auto">
                <h1 className="text-6xl font-black mb-12 bg-gradient-to-r from-game-red to-game-blue bg-clip-text text-transparent">
                    Sequenc.ia
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-start">
                    {/* Left Column: Actions */}
                    <div className="space-y-4 max-w-md mx-auto w-full">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-4 rounded-xl transition-colors"
                        >
                            {t.lobby_createGame}
                        </button>

                        {lastGameExists && localStorage.getItem('lastGameRoomId') && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                                <div className="text-white/60 text-sm mb-2">{t.lobby_previousGame}</div>
                                <button
                                    onClick={() => {
                                        const code = localStorage.getItem('lastGameRoomId');
                                        const name = localStorage.getItem('lastPlayerName');

                                        if (code && name) {
                                            onJoinGame(code, name);
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
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t.lobby_roomCodePlaceholder}
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="flex-1 p-3 rounded bg-white/10 border border-white/20 focus:border-game-blue outline-none transition-colors placeholder-white/50 uppercase font-mono text-white"
                                    maxLength={6}
                                />
                                <button
                                    onClick={async () => {
                                        if (joinCode.trim()) {
                                            setCheckingRoom(true);
                                            const { getRoomInfo } = await import('../../services/game');
                                            const roomInfo = await getRoomInfo(joinCode.toUpperCase());
                                            setCheckingRoom(false);

                                            if (!roomInfo.exists) {
                                                setToastMessage(t.error_roomNotFound);
                                                setTimeout(() => setToastMessage(null), 3000);
                                                return;
                                            }

                                            // Room exists, create game object with correct privacy status
                                            const minimalGame: FirestoreGame = {
                                                roomId: joinCode.toUpperCase(),
                                                status: 'waiting',
                                                maxPlayers: 0,
                                                players: {},
                                                createdAt: Date.now(),
                                                board: [],
                                                deck: [],
                                                discardPile: [],
                                                currentPlayerIndex: 0,
                                                winner: null,
                                                isPrivate: roomInfo.isPrivate
                                            };
                                            setSelectedJoinRoom(minimalGame);
                                        }
                                    }}
                                    disabled={!joinCode.trim() || checkingRoom}
                                    className="bg-game-blue hover:bg-blue-600 px-6 py-3 rounded font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {checkingRoom ? t.lobby_checkingRoom : t.lobby_join}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Room List */}
                    <div className="bg-white/5 p-6 rounded-xl border border-white/10 h-full min-h-[400px] flex flex-col">
                        <div className="flex-1">
                            <RoomList
                                onJoin={(game) => {
                                    setSelectedJoinRoom(game);
                                }}
                            />
                            {/* Placeholder for RoomList update */}
                        </div>

                        {/* Dev Tools */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete ALL games? This cannot be undone.')) {
                                        await deleteAllGames();
                                        alert('All games cleared!');
                                    }
                                }}
                                className="text-xs text-red-500 hover:text-red-400 underline"
                            >
                                DEV: Clear All Games
                            </button>
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

                {selectedJoinRoom && (
                    <JoinGameModal
                        roomName={selectedJoinRoom.roomId}
                        isPrivate={!!selectedJoinRoom.isPrivate}
                        initialName=""
                        onClose={() => setSelectedJoinRoom(null)}
                        onJoin={async (name, password) => {
                            await onJoinGame(selectedJoinRoom.roomId, name, password);
                            setSelectedJoinRoom(null);
                        }}
                    />
                )}

                {/* Toast Message */}
                {toastMessage && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-4 z-50">
                        {toastMessage}
                    </div>
                )}
            </div>
        </div>
    );
};
