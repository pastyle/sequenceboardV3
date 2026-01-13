import { SUITS, RANKS } from './constants';
import type { JackType } from '../types/game.types';

export function createDeck(): string[] {
    let newDeck: string[] = [];
    // Two standard decks
    for (let d = 0; d < 2; d++) {
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                newDeck.push(rank + suit);
            }
            // Add Jacks (Legacy logic: added separately)
            newDeck.push('J' + suit);
        }
    }
    return shuffle(newDeck);
}

export function shuffle(array: string[]): string[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

export function classifyCard(cardString: string): { type: JackType; val: string } {
    if (!cardString.includes('J')) return { type: 'normal', val: cardString };

    // Check for Jacks
    const suit = cardString.slice(-1); // Last char is suit
    const JACK_TWOS = ['♣', '♦']; // Two-eyed
    const JACK_ONES = ['♠', '♥']; // One-eyed

    if (JACK_TWOS.includes(suit)) return { type: 'two-eyed', val: cardString };
    if (JACK_ONES.includes(suit)) return { type: 'one-eyed', val: cardString };

    return { type: 'normal', val: cardString }; // Fallback
}
