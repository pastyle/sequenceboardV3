import React from 'react';
import type { Team } from '../types/game.types';

interface GameHeaderProps {
    status: string;
    winner: Team | null;
    onReset: () => void;
    onDebugWin: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ status, winner, onReset, onDebugWin }) => {
    return (
        <header className="h-[60px] bg-bg-panel flex items-center justify-between px-8 shadow-md shrink-0 border-b border-white/5">
            <div className="text-2xl font-bold tracking-widest bg-gradient-to-tr from-clubs to-hearts bg-clip-text text-transparent select-none cursor-pointer" onClick={onReset}>
                SEQUENCE
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

                <div className={`font-bold transition-colors duration-300 ${winner ? 'text-[#FFD700] text-xl' : 'text-white'}`}>
                    {status}
                </div>
            </div>
        </header>
    );
};
