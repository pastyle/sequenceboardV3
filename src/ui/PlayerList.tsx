import React from 'react';
import type { Player } from '../types/game.types';
import { twMerge } from 'tailwind-merge';

interface PlayerListProps {
    players: Player[];
    currentPlayerIndex: number;
    deckCount: number;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerIndex, deckCount }) => {
    return (
        <aside className="w-[250px] bg-black/20 p-4 border-r border-white/5 shrink-0 flex flex-col h-full">
            <h2 className="text-sm text-text-secondary mb-4 uppercase">Players</h2>

            <div className="flex-1">
                {players.map((player, idx) => (
                    <div
                        key={player.id}
                        className={twMerge(
                            "flex items-center gap-3 p-3 bg-bg-panel rounded-lg mb-3 border border-transparent transition-all",
                            idx === currentPlayerIndex
                                ? "border-clubs bg-[rgba(0,200,179,0.1)] opacity-100"
                                : "opacity-50"
                        )}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: player.team === 'red' ? '#FF595D' : '#0088FF' }}
                        >
                            P{player.id}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">{player.name}</span>
                            <span className="text-xs text-text-secondary capitalize">{player.team} Team</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 pt-4 border-t border-white/5">
                <h3 className="text-sm text-text-secondary mb-2 uppercase">Main Deck</h3>
                <div className="bg-bg-panel p-3 rounded-lg text-center font-bold text-clubs shadow-inner">
                    Cards: <span>{deckCount}</span>
                </div>
            </div>
        </aside>
    );
};
