import React from 'react';
import type { Team } from '../types/game.types';

interface GameHeaderProps {
    status: string;
    winner: Team | null;
    onReset: () => void;
    onDebugWin: () => void;
    isMyTurn: boolean;
    roomId?: string;
    turnStartedAt?: number;
    turnTimeLimit?: number; // e.g. 30000
}

export const GameHeader: React.FC<GameHeaderProps> = ({ status, winner, onReset, onDebugWin, isMyTurn, roomId }) => {
    return (
        <header className="h-[60px] bg-bg-panel flex items-center justify-between px-8 shadow-md shrink-0 border-b border-white/5">
            <div className="flex items-center gap-6">
                <div className="text-2xl font-bold tracking-widest bg-gradient-to-tr from-clubs to-hearts bg-clip-text text-transparent select-none cursor-pointer" onClick={onReset}>
                    SEQUENCE
                </div>
                {roomId && (
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded text-xs text-text-secondary border border-white/5 group relative">
                        <span className="uppercase font-bold tracking-wider opacity-60">Room:</span>
                        <span className="font-mono text-white select-all">{roomId}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(roomId)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-clubs hover:text-white"
                            title="Copy Room ID"
                        >
                            📋
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                {/* Debug Button */}
                <button
                    onClick={onDebugWin}
                    className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded text-text-secondary transition-colors"
                    title="Setup Win Scenario"
                >
                    ⚡ Test Win
                </button>

                <div className={`font-bold transition-all duration-300 ${winner ? 'text-[#FFD700] text-xl scale-110' :
                    isMyTurn ? 'text-[#FFD700] text-lg' : 'text-white'
                    }`}>
                    {isMyTurn && !winner ? "YOUR TURN" : status}
                </div>
            </div>
        </header>
    );
};
