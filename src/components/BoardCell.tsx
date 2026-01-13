import React from 'react';

import { twMerge } from 'tailwind-merge';
import type { Team } from '../types/game.types';

interface BoardCellProps {
    row: number;
    col: number;
    card: string;
    owner: Team | null;
    isLocked: boolean; // Part of winning sequence?
    isValidTarget: boolean;
    isValidRemove: boolean;
    isWinningCell: boolean; // Part of final win sequence
    onClick: () => void;
}

export const BoardCell: React.FC<BoardCellProps> = ({
    card, owner, isWinningCell, isValidTarget, isValidRemove, onClick
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

            {/* Marker */}
            {owner && (
                <div className={twMerge(
                    "absolute w-[80%] h-[80%] rounded-full shadow-md border-[3px] border-[rgb(0_0_0_/_0.1)]",
                    owner === 'red'
                        ? "bg-[radial-gradient(circle_at_30%_30%,#ff8a8d,#FF595D)]"
                        : "bg-[radial-gradient(circle_at_30%_30%,#5cb3ff,#0088FF)]",
                    isWinningCell && "shadow-[0_0_15px_5px_#FFD700] border-white animate-winPulse z-30"
                )} />
            )}
        </div>
    );
};
