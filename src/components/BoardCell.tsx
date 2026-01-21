import React from 'react';

import { twMerge } from 'tailwind-merge';
import type { Team } from '../types/game.types';

interface BoardCellProps {
    row: number;
    col: number;
    card: string;
    label?: string; // e.g. "A1"
    owner: Team | null;
    isLocked: boolean; // Part of winning sequence?
    isValidTarget: boolean;
    isValidRemove: boolean;
    isWinningCell: boolean; // Part of final win sequence
    isLastMove?: boolean;
    lastMoveType?: 'place' | 'remove';
    onClick: () => void;
}

export const BoardCell: React.FC<BoardCellProps> = ({
    card, label, owner, isWinningCell, isValidTarget, isValidRemove, isLastMove, lastMoveType, onClick
}) => {

    // Helper for suit styles
    const getSuitClass = (cardVal: string) => {
        if (cardVal === 'Joker') return 'bg-[radial-gradient(circle,#888_30%,#AFAFAF_100%)] text-[0.7rem] font-extrabold tracking-widest';
        if (cardVal.includes('♠')) return 'bg-spades text-white';
        if (cardVal.includes('♣')) return 'bg-clubs text-white';
        if (cardVal.includes('♥')) return 'bg-hearts text-white';
        if (cardVal.includes('♦')) return 'bg-diamonds text-white';
        return 'bg-white text-gray-800';
    };

    const isJoker = card === 'Joker';
    const wasRemoved = isLastMove && lastMoveType === 'remove';

    return (
        <div
            className={twMerge(
                "relative flex items-center justify-center rounded-md font-bold text-[1.7rem] select-none transition-transform duration-100",
                getSuitClass(card),
                !owner && "hover:z-10 hover:scale-105 hover:shadow-lg cursor-pointer",
                isValidTarget && "shadow-[inset_0_0_0_4px_#FFD700] animate-pulse z-10 cursor-pointer",
                isValidRemove && "shadow-[inset_0_0_0_4px_#FF0000] animate-shake z-10 cursor-pointer",
                isWinningCell && "shadow-[inset_0_0_15px_#FFD700] z-20" // Highlight Joker if winning
            )}
            onClick={onClick}
            data-card={card}
        >
            {/* Card Value */}
            {isJoker ? 'JOKER' : card}

            {/* Removed Token Indicator (Red Ring) */}
            {wasRemoved && (
                <div className="absolute w-[80%] h-[80%] rounded-full border-4 border-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.6)] animate-pulse z-20 pointer-events-none" />
            )}

            {/* Marker */}
            {owner && (
                <div className={twMerge(
                    "absolute w-[80%] h-[80%] rounded-full shadow-md border-[3px] border-[rgb(0_0_0_/_0.1)] flex items-center justify-center",
                    owner === 'red' && "bg-[radial-gradient(circle_at_30%_30%,#ff8a8d,#FF595D)]",
                    owner === 'blue' && "bg-[radial-gradient(circle_at_30%_30%,#5cb3ff,#0088FF)]",
                    owner === 'green' && "bg-[radial-gradient(circle_at_30%_30%,#66ffa3,#22c55e)]",
                    isWinningCell && "shadow-[0_0_15px_5px_#FFD700] border-white animate-winPulse z-30",
                    isLastMove && !isWinningCell && "shadow-[0_0_10px_3px_#FFFFFF] border-[#FFF] ring-2 ring-offset-2 ring-offset-[#111] ring-[#FFF] z-20"
                )}>
                    {/* Soft Coordinate Label */}
                    {label && (
                        <span className="text-[0.6em] font-medium text-black/40 pointer-events-none select-none">
                            {label}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
