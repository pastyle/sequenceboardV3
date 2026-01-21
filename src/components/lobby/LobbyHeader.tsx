import React from 'react';
import { LanguageSelector } from '../ui/LanguageSelector';

export const LobbyHeader: React.FC = () => {
    return (
        <header className="h-14 border-b border-white/10 bg-bg-panel px-4 flex items-center justify-between shrink-0">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Sequenc.ia
            </h1>

            <LanguageSelector />
        </header>
    );
};
