import React from 'react';
import { Card } from './Card';

interface PlayerHandProps {
    hand: string[];
    selectedCardIndex: number;
    onCardClick: (index: number) => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({ hand, selectedCardIndex, onCardClick }) => {
    return (
        <div className="w-[120px] bg-bg-panel p-4 flex flex-col items-center border-l border-white/5 overflow-y-auto h-full max-h-[100vh]">
            <h3 className="text-xs text-text-secondary mb-4 uppercase text-center">Your Hand</h3>
            <div className="flex flex-col gap-3 w-full items-center">
                {hand.map((card, index) => (
                    <Card
                        key={`${card}-${index}`}
                        val={card}
                        isSelected={index === selectedCardIndex}
                        onClick={() => onCardClick(index)}
                    />
                ))}
            </div>
        </div>
    );
};
