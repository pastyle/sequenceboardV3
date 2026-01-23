import React from 'react';
import type { Team } from '../types/game.types';

interface GameHeaderProps {
    status: string;
    winner: Team | null;
    onReset: () => void;
    isMyTurn: boolean;
    roomId?: string;
    turnStartedAt?: number;
    turnTimeLimit?: number; // e.g. 30000
}

import { LanguageSelector } from '../components/ui/LanguageSelector';
import { useLanguage } from '../i18n';

export const GameHeader: React.FC<GameHeaderProps> = ({ status, winner, onReset, isMyTurn, roomId }) => {
    const { t } = useLanguage();
    return (
        <header className="h-[60px] bg-bg-panel flex items-center justify-between px-8 shadow-md shrink-0 border-b border-white/5">
            <div className="flex items-center gap-6">
                <div className="text-2xl font-bold tracking-widest bg-gradient-to-tr from-clubs to-hearts bg-clip-text text-transparent select-none cursor-pointer" onClick={onReset}>
                    Sequenc.ia
                </div>
                {roomId && (
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded text-xs text-text-secondary border border-white/5 group relative">
                        <span className="uppercase font-bold tracking-wider opacity-60">{t.game_room}:</span>
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
                <button
                    onClick={() => {
                        if (window.confirm('Exit to Lobby?')) {
                            // Simple reload/nav to root for now or proper leave handler passed as prop? 
                            // Prop isn't there, so window.location.href to '/' is safest "hard exit" or navigate
                            window.location.href = '/';
                        }
                    }}
                    className="text-white/50 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-sm font-medium border border-transparent hover:border-white/20"
                >
                    {t.game_exitToLobby}
                </button>
                <div className="h-6 w-px bg-white/10" />
                <LanguageSelector />

                <div className={`font-bold transition-all duration-300 ${winner ? 'text-[#FFD700] text-xl scale-110' :
                    isMyTurn ? 'text-[#FFD700] text-lg' : 'text-white'
                    }`}>
                    {isMyTurn && !winner ? t.game_yourTurn : status}
                </div>
            </div>
        </header>
    );
};
