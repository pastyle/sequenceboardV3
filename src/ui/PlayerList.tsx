import React from 'react';
import type { Player } from '../types/game.types';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../i18n';

interface PlayerListProps {
    players: Player[];
    currentPlayerIndex: number;
    deckCount: number;
    localPlayerUid?: string;
}

export const TEAM_COLORS = {
    red: '#FF595D',
    blue: '#0088FF',
    green: '#22c55e'
};

const OfflineTimer: React.FC<{ lastSeen?: number }> = ({ lastSeen }) => {
    const [timeLeft, setTimeLeft] = React.useState(0);

    React.useEffect(() => {
        if (!lastSeen) return;
        const interval = setInterval(() => {
            const elapsed = Date.now() - lastSeen;
            const remaining = Math.max(0, 30000 - elapsed);
            setTimeLeft(Math.ceil(remaining / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [lastSeen]);

    if (timeLeft <= 0) return null; // Bot should take over

    return (
        <span className="text-[11px] text-orange-400 font-extrabold uppercase tracking-wider ml-1">
            ({timeLeft}s)
        </span>
    );
};

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerIndex, deckCount, localPlayerUid }) => {
    const { t } = useLanguage();

    const getTeamName = (team: string) => {
        const key = `game_team${team.charAt(0).toUpperCase() + team.slice(1)}`;
        return t[key] || `${team} Team`;
    };

    return (
        <aside className="w-[250px] bg-black/20 p-4 border-r border-white/5 shrink-0 flex flex-col h-full">
            <h2 className="text-sm text-text-secondary mb-4 uppercase font-bold tracking-wider">{t.waiting_players}</h2>

            <div className="flex-1">
                {players.map((player, idx) => {
                    const isCurrentTurn = idx === currentPlayerIndex;
                    const isLocalPlayer = player.uid === localPlayerUid;
                    const isOffline = player.connectionStatus === 'offline';

                    return (
                        <div
                            key={player.id}
                            className={twMerge(
                                "flex items-center gap-3 p-3 bg-bg-panel rounded-lg mb-3 border border-transparent transition-all relative overflow-hidden",
                                isCurrentTurn
                                    ? "border-clubs/50 bg-clubs/10 ring-1 ring-clubs/20 opacity-100 scale-[1.02] shadow-lg"
                                    : "opacity-60 grayscale-[0.3]",
                                isOffline && "opacity-40 grayscale border-red-500/30 bg-red-500/5 ring-1 ring-red-500/20"
                            )}
                            title={isOffline ? "Disconnected" : "Connected"}
                        >
                            {isCurrentTurn && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-clubs animate-pulse" />
                            )}

                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md border-2 border-white/10 shrink-0"
                                style={{ backgroundColor: TEAM_COLORS[player.team] || '#888' }}
                            >
                                P{player.id}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-sm truncate max-w-[120px]">
                                        {player.name}
                                        {player.isBot && <span className="ml-2 text-xs bg-purple-500 text-white px-1 py-0.5 rounded" title="Bot Playing">🤖 BOT</span>}
                                    </span>
                                    {isLocalPlayer && (
                                        <span className="bg-white/10 text-[10px] px-1.5 py-0.5 rounded text-white font-extrabold tracking-tighter uppercase whitespace-nowrap">
                                            {t.waiting_you}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-text-secondary capitalize font-medium">{getTeamName(player.team)}</span>
                                    {isOffline && !player.isBot && (
                                        <div className="flex items-center">
                                            <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider">
                                                OFFLINE
                                            </span>
                                            <OfflineTimer lastSeen={player.lastSeen} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5">
                <h3 className="text-[10px] text-text-secondary mb-2 uppercase font-bold tracking-wider">{t.game_mainDeck}</h3>
                <div className="bg-bg-panel p-3 rounded-lg text-center font-bold text-clubs shadow-inner border border-white/5">
                    {t.game_cardsLeft} <span className="text-white ml-1">{deckCount}</span>
                </div>
            </div>
        </aside>
    );
};
