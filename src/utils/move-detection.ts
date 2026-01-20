import { isValidMove } from '../game/rules';
import type { BoardState, Player } from '../types/game.types';

/**
 * Checks if a player has any valid move available
 * Iterates through all cards in hand and all board positions
 */
export function hasAnyValidMove(
    player: Player,
    board: BoardState
): boolean {
    // Check each card in player's hand
    for (const card of player.hand) {
        // Check each position on the board
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 10; col++) {
                const result = isValidMove(card, row, col, board, player.team);
                if (result.isValid) {
                    return true; // Found a valid move
                }
            }
        }
    }
    return false; // No valid moves found
}
