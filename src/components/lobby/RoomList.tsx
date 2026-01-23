import React, { useEffect, useState } from 'react';
import type { FirestoreGame } from '../../types/firebase';
import { listActiveGames } from '../../services/game';

import { useLanguage } from '../../i18n';

interface RoomListProps {
    onJoin: (game: FirestoreGame) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onJoin }) => {
    const [games, setGames] = useState<FirestoreGame[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        const unsubscribe = listActiveGames((activeGames) => {
            setGames(activeGames);
        });
        return () => unsubscribe();
    }, []);

    const handleJoinClick = (game: FirestoreGame) => {
        onJoin(game);
    };

    const getOccupancyColor = (current: number, max: number) => {
        if (current >= max) return 'text-red-500';
        if (current >= max - 1) return 'text-yellow-500';
        return 'text-green-500';
    };

    if (games.length === 0) {
        return (
            <div className="text-center text-white/40 py-8 border border-dashed border-white/10 rounded-lg">
                <p>{t.lobby_noRooms}</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            <h3 className="text-white/60 text-sm uppercase font-bold tracking-wider mb-2">{t.lobby_activeRooms}</h3>
            {games.map((game) => {
                const playerCount = Object.keys(game.players).length;
                const isFull = playerCount >= game.maxPlayers;
                const host = Object.values(game.players).find(p => p.isHost);

                return (
                    <div
                        key={game.id}
                        className="bg-white/5 border border-white/10 p-4 rounded-lg flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-xl font-bold text-white">{game.roomId}</span>
                                {game.isPrivate && <span title={t.lobby_privateRoom}>🔒</span>}
                            </div>
                            <span className="text-sm text-white/50">{t.lobby_host}: <span className="text-white">{host?.name || 'Unknown'}</span></span>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <span className={`font-bold text-lg ${getOccupancyColor(playerCount, game.maxPlayers)}`}>
                                    {playerCount} / {game.maxPlayers}
                                </span>
                                <p className="text-xs text-white/40">{t.waiting_players}</p>
                            </div>

                            <button
                                onClick={() => handleJoinClick(game)}
                                disabled={isFull}
                                className={`px-4 py-2 rounded font-bold transition-transform active:scale-95 ${isFull
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-game-blue text-white hover:brightness-110'
                                    }`}
                            >
                                {isFull ? t.lobby_full : t.lobby_join}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
