import React from 'react';

import { twMerge } from 'tailwind-merge';
import { useMemo } from 'react';

interface CardProps {
    val: string;
    isSelected?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    className?: string;
}

export const Card: React.FC<CardProps> = ({ val, isSelected, onClick, onMouseEnter, onMouseLeave, className }) => {

    const cardInfo = useMemo(() => {
        if (!val.includes('J')) return { type: 'normal', suit: val.slice(-1) };
        const suit = val.slice(-1);
        if (['♣', '♦'].includes(suit)) return { type: 'two-eyed' }; // Add
        if (['♠', '♥'].includes(suit)) return { type: 'one-eyed' }; // Remove
        return { type: 'normal', suit };
    }, [val]);

    const getSuitColorClass = (suit: string) => {
        switch (suit) {
            case '♠': return 'bg-spades text-white';
            case '♣': return 'bg-clubs text-white';
            case '♥': return 'bg-hearts text-white';
            case '♦': return 'bg-diamonds text-white';
            default: return 'bg-white text-black';
        }
    };

    const baseClasses = "w-[60px] h-[60px] rounded-md flex items-center justify-center font-bold text-2xl cursor-pointer transition-transform relative select-none border-2 border-transparent hover:-translate-x-1";
    const selectedClasses = "!-translate-x-3 border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.3)]";

    if (cardInfo.type === 'two-eyed') {
        return (
            <div
                className={twMerge(baseClasses, "bg-add-jack text-white text-4xl shadow-md", isSelected && selectedClasses, className)}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                +
            </div>
        );
    }

    if (cardInfo.type === 'one-eyed') {
        return (
            <div
                className={twMerge(baseClasses, "bg-remove-jack text-white text-4xl shadow-md", isSelected && selectedClasses, className)}
                onClick={onClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                -
            </div>
        );
    }

    return (
        <div
            className={twMerge(baseClasses, getSuitColorClass(cardInfo.suit!), isSelected && selectedClasses, className)}
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {val}
        </div>
    );
};
