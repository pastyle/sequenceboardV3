import React, { useEffect, useState, useRef } from 'react';
import type { Team } from '../types/game.types';

interface TurnNotificationProps {
    isMyTurn: boolean;
    playerName?: string;
    teamColor?: string;
    winner: Team | null;
    winnerText?: string;
    localPlayerTeam?: Team;
    isHost?: boolean;
    onRestart: () => void;
}

export const TurnNotification: React.FC<TurnNotificationProps> = ({
    isMyTurn,
    playerName,
    teamColor,
    winner,
    winnerText,
    localPlayerTeam,
    isHost,
    onRestart
}) => {
    const [showTurnBanner, setShowTurnBanner] = useState(false);
    const [hasPlayedEndSound, setHasPlayedEndSound] = useState(false);
    const turnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Effect for Turn Notification
    useEffect(() => {
        // Clear any existing timer when dependencies change
        if (turnTimerRef.current) {
            clearTimeout(turnTimerRef.current);
            turnTimerRef.current = null;
        }

        // Only show turn banner if game is NOT over
        if (isMyTurn && !winner) {
            setShowTurnBanner(true);

            // Play turn sound
            const audio = new Audio('/sounds/notification-your-turn.mp3');
            audio.play().catch(err => console.log('Turn audio failed:', err));

            // Auto-hide after 3 seconds
            turnTimerRef.current = setTimeout(() => {
                setShowTurnBanner(false);
            }, 3000);
        } else {
            setShowTurnBanner(false);
        }

        return () => {
            if (turnTimerRef.current) {
                clearTimeout(turnTimerRef.current);
            }
        };
    }, [isMyTurn, winner]);

    // Effect for Game Over Sound
    useEffect(() => {
        if (winner && !hasPlayedEndSound) {
            setHasPlayedEndSound(true);

            const soundFile = localPlayerTeam === winner
                ? '/sounds/notification-game-win.mp3'
                : '/sounds/notification-game-over.mp3';

            const audio = new Audio(soundFile);
            audio.play().catch(err => console.log('Game end audio failed:', err));
        }

        if (!winner) {
            setHasPlayedEndSound(false);
        }
    }, [winner, localPlayerTeam, hasPlayedEndSound]);

    const isGameOver = !!winner;
    const shouldShow = isGameOver || showTurnBanner;

    if (!shouldShow) return null;

    return (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[100] animate-in fade-in zoom-in duration-300 pointer-events-auto">
            <div
                className="text-white px-12 py-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-4 border-white/20 flex flex-col items-center gap-4 transition-colors duration-500"
                style={{ backgroundColor: isGameOver ? '#1a1a1a' : (teamColor || '#00C8B3') }}
            >
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-black uppercase tracking-tighter italic">
                        {isGameOver ? 'Fim de Jogo!' : 'Sua Vez!'}
                    </span>

                    {!isGameOver && playerName && (
                        <span className="text-sm font-bold opacity-80 mt-1">{playerName}, é seu momento!</span>
                    )}

                    {isGameOver && (
                        <span className="text-lg font-bold mt-2 text-clubs">
                            {winnerText || `TIME ${winner?.toUpperCase()} VENCEU!`}
                        </span>
                    )}
                </div>

                {isGameOver && isHost && (
                    <button
                        onClick={onRestart}
                        className="mt-2 bg-white text-bg-dark px-8 py-3 rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl active:scale-95 cursor-pointer"
                    >
                        Reiniciar Partida
                    </button>
                )}
            </div>

            <div
                className="absolute inset-0 -z-10 blur-3xl animate-pulse rounded-full opacity-50"
                style={{ backgroundColor: isGameOver ? '#000' : (teamColor || '#00C8B3') }}
            />
        </div>
    );
};
