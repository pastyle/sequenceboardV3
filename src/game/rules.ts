import { classifyCard } from './deck';
import type { BoardState, Team } from '../types/game.types';
import { BOARD_MATRIX } from './constants';

export function isValidMove(
    cardString: string,
    row: number,
    col: number,
    boardState: BoardState,
    playerTeam: Team
): { isValid: boolean; type?: 'place' | 'remove' } {
    const cardInfo = classifyCard(cardString);
    const targetCell = boardState[row][col];
    const isOccupied = targetCell.owner !== null;
    const cellCardValue = BOARD_MATRIX[row][col]; // Value printed on board
    const isCornerJoker = cellCardValue === 'Joker';

    if (cardInfo.type === 'one-eyed') {
        // Remove ANY opponent marker (not own team, and not empty)
        if (isOccupied && targetCell.owner !== playerTeam) {
            // One-eyed jacks can remove from any cell (unless locked - TODO: locking)
            return { isValid: true, type: 'remove' };
        }
    } else {
        // Placement Logic (Normal or Two-Eyed)
        // 1. Normal card matches cell value AND cell is empty
        // 2. Two-Eyed Jack (places anywhere empty)
        // 3. User Rule: Corner Jokers accept any card if empty

        const isMatchingCard = cardInfo.type === 'normal' && cellCardValue === cardInfo.val;
        const isTwoEyed = cardInfo.type === 'two-eyed';
        // Legacy: "isCornerWild = isJoker; User rule: Corner Jokers accept any card"
        const isCornerWild = isCornerJoker;

        if (!isOccupied) {
            if (isMatchingCard || isTwoEyed || isCornerWild) {
                return { isValid: true, type: 'place' };
            }
        }
    }

    return { isValid: false };
}
