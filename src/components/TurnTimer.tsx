import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n';

interface TurnTimerProps {
    turnStartedAt: number;
    turnTimeLimit: number; // 30 seconds
    isMyTurn: boolean;
    gameOver?: boolean;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
    turnStartedAt, turnTimeLimit, isMyTurn, gameOver
}) => {
    const [timeRemaining, setTimeRemaining] = useState(30);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasPlayedRef = useRef<Set<number>>(new Set());
    const { t } = useLanguage();

    useEffect(() => {
        // Reset on turn change
        hasPlayedRef.current.clear();

        // Stop timer if game is over
        if (gameOver) {
            return;
        }

        const interval = setInterval(() => {
            const elapsed = (Date.now() - turnStartedAt) / 1000;
            const remaining = Math.max(0, turnTimeLimit - elapsed);
            setTimeRemaining(remaining);

            // Play sound in last 5 seconds
            if (remaining <= 5 && remaining > 0 && isMyTurn) {
                const second = Math.floor(remaining);
                if (!hasPlayedRef.current.has(second)) {
                    hasPlayedRef.current.add(second);
                    playBeep();
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [turnStartedAt, turnTimeLimit, isMyTurn, gameOver]);

    const playBeep = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/notification-beep-counter.mp3');
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
    };

    // Don't show if not player's turn or game is over
    if (!isMyTurn || gameOver) return null;

    const isWarning = timeRemaining <= 5;
    const seconds = Math.ceil(timeRemaining);

    return (
        <div className={`w-full px-2 py-2 rounded-lg text-center transition-all ${isWarning
            ? 'bg-red-600 animate-pulse'
            : 'bg-gray-700'
            }`}>
            <div className={`font-bold ${isWarning ? 'text-2xl text-white' : 'text-sm text-gray-300'}`}>
                {seconds}s
            </div>
            {isWarning && (
                <div className="text-xs text-white mt-1">
                    {t.hand_timeRunningOut}
                </div>
            )}
        </div>
    );
};
