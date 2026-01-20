import React, { useState, useEffect, useRef } from 'react';

interface TurnTimerProps {
    turnStartedAt: number;
    turnTimeLimit: number; // 30 seconds
    isMyTurn: boolean;
}

export const TurnTimer: React.FC<TurnTimerProps> = ({
    turnStartedAt, turnTimeLimit, isMyTurn
}) => {
    const [timeRemaining, setTimeRemaining] = useState(30);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hasPlayedRef = useRef<Set<number>>(new Set());

    useEffect(() => {
        // Reset on turn change
        hasPlayedRef.current.clear();

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
    }, [turnStartedAt, turnTimeLimit, isMyTurn]);

    const playBeep = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio('/sounds/notification-beep-counter.mp3');
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
    };

    // Only show in last 5 seconds of your turn
    if (!isMyTurn || timeRemaining > 5) return null;

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 
                        bg-red-600 text-white px-8 py-4 rounded-lg shadow-2xl 
                        animate-pulse">
            <div className="text-4xl font-bold text-center">
                {Math.ceil(timeRemaining)}
            </div>
            <div className="text-sm text-center mt-1">
                seconds remaining
            </div>
        </div>
    );
};
