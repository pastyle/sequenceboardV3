import React from 'react';
import { Card } from './Card';

interface PlayerHandProps {
    hand: string[];
    selectedCardIndex: number;
    onCardClick: (index: number) => void;
    canDiscard?: boolean;
    onDiscard?: () => void;
}

export const PlayerHand: React.FC<PlayerHandProps> = ({
    hand, selectedCardIndex, onCardClick, canDiscard, onDiscard
}) => {
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

            {/* Discard button - shows when player has no valid moves */}
            {canDiscard && onDiscard && (
                <div className="mt-6 w-full px-2">
                    <button
                        onClick={onDiscard}
                        className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg 
                                   flex flex-col items-center gap-1 transition-colors text-xs
                                   border border-red-500/50"
                        title="No valid moves - discard a card"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                        <span className="font-medium">Discard</span>
                    </button>
                    <p className="text-xs text-yellow-400 mt-2 text-center">
                        No valid moves
                    </p>
                </div>
            )}
        </div>
    );
};
