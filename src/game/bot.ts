import type { BoardState, Player, Team } from '../types/game.types';
import { classifyCard } from './deck';
import { BOARD_MATRIX } from './constants';

interface BotMove {
    card: string;
    row: number;
    col: number;
    moveType: 'place' | 'remove';
    score: number;
}

export const calculateBotMove = (
    board: BoardState,
    player: Player,
    _allPlayers: Player[]
): BotMove | null => {
    const possibleMoves: BotMove[] = [];

    // 1. Generate all valid moves
    if (!player.hand) return null;

    player.hand.forEach(card => {
        const info = classifyCard(card);

        if (info.type === 'two-eyed') {
            // Can place anywhere empty
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (!board[r][c].owner) {
                        possibleMoves.push({ card, row: r, col: c, moveType: 'place', score: 0 });
                    }
                }
            }
        } else if (info.type === 'one-eyed') {
            // Can remove any opponent piece
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c < 10; c++) {
                    if (board[r][c].owner && board[r][c].owner !== player.team) {
                        possibleMoves.push({ card, row: r, col: c, moveType: 'remove', score: 0 });
                    }
                }
            }
        } else {
            // Regular card uses info.val to find matches on board
            const matches = getCardPositionMatches(info.val);
            matches.forEach(pos => {
                if (!board[pos.r][pos.c].owner) {
                    possibleMoves.push({ card, row: pos.r, col: pos.c, moveType: 'place', score: 0 });
                }
            });
        }
    });

    if (possibleMoves.length === 0) return null;

    // 2. Score moves
    possibleMoves.forEach(move => {
        if (move.moveType === 'place') {
            move.score += scorePlacement(board, move.row, move.col, player.team);
        } else {
            move.score += scoreRemoval(board, move.row, move.col, player.team);
        }
    });

    // Filter out moves with 0 score (useless moves)
    const usefulMoves = possibleMoves.filter(m => m.score > 0);

    if (usefulMoves.length === 0) {
        // If no useful moves (all score 0), PREFER PLACEMENT.
        // Save removal cards for when they actually generate a score.
        const fallbackPlacements = possibleMoves.filter(m => m.moveType === 'place');
        if (fallbackPlacements.length > 0) {
            return fallbackPlacements[Math.floor(Math.random() * fallbackPlacements.length)];
        }

        // If no placements possible (unlikely), then use whatever is left
        if (possibleMoves.length > 0) {
            return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        }
        return null;
    }

    // 3. Return best move with resource preservation
    usefulMoves.sort((a, b) => b.score - a.score);

    // Separate placement and removal moves
    const placementMoves = usefulMoves.filter(m => m.moveType === 'place');
    const removalMoves = usefulMoves.filter(m => m.moveType === 'remove');

    const bestPlacement = placementMoves.length > 0 ? placementMoves[0] : null;
    const bestRemoval = removalMoves.length > 0 ? removalMoves[0] : null;

    // Resource preservation: Only use removal if it's significantly better
    // If we have a removal move that is high score (e.g. 1000 = stopping a win), take it.
    // If removal is low score (e.g. 30 = just breaking a 3-sequence), do not prefer it over a good placement.

    if (bestRemoval) {
        // If removal is critical (stopping a win), take it immediately
        if (bestRemoval.score >= 1000) {
            return bestRemoval;
        }

        // If we have a placement
        if (bestPlacement) {
            // Calculate threshold. If placement is decent, we need removal to be MUCH better.
            const removalThreshold = bestPlacement.score * 1.5;

            if (bestRemoval.score < removalThreshold) {
                return bestPlacement;
            }
        }
    }

    // If we are here, either:
    // 1. No removal moves
    // 2. Removal moves exist but aren't critical and aren't better than placement
    // 3. Only removal moves exist (and they are > 0 score)

    if (bestPlacement) return bestPlacement;
    if (bestRemoval) return bestRemoval;

    return usefulMoves[0];
};

function getCardPositionMatches(cardVal: string) {
    const matches: { r: number, c: number }[] = [];
    for (let r = 0; r < 10; r++) {
        for (let c = 0; c < 10; c++) {
            if (BOARD_MATRIX[r][c] === cardVal) {
                matches.push({ r, c });
            }
        }
    }
    return matches;
}

function scorePlacement(board: BoardState, r: number, c: number, team: Team): number {
    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let [dr, dc] of directions) {
        let lineLength = 1;
        // Forward
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === team || isCorner(nr, nc))) lineLength++;
            else break;
        }
        // Backward
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === team || isCorner(nr, nc))) lineLength++;
            else break;
        }

        if (lineLength >= 5) score += 1000;
        else if (lineLength === 4) score += 50;
        else if (lineLength === 3) score += 20;
        else if (lineLength === 2) score += 5;
    }

    return score;
}

/**
 * Count how many open ends a sequence has (0, 1, or 2)
 * An "open end" is an empty space that could extend the sequence
 */
function countOpenEnds(board: BoardState, r: number, c: number, dr: number, dc: number, team: Team): number {
    let openEnds = 0;

    // Check forward end
    let forwardSteps = 0;
    for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (!isValid(nr, nc)) break;
        if (board[nr][nc].owner === team || isCorner(nr, nc)) {
            forwardSteps = i;
        } else {
            break;
        }
    }
    // Check if there's an empty space right after the sequence
    const forwardEndR = r + dr * (forwardSteps + 1);
    const forwardEndC = c + dc * (forwardSteps + 1);
    if (isValid(forwardEndR, forwardEndC) && !board[forwardEndR][forwardEndC].owner) {
        openEnds++;
    }

    // Check backward end
    let backwardSteps = 0;
    for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (!isValid(nr, nc)) break;
        if (board[nr][nc].owner === team || isCorner(nr, nc)) {
            backwardSteps = i;
        } else {
            break;
        }
    }
    // Check if there's an empty space right after the sequence
    const backwardEndR = r - dr * (backwardSteps + 1);
    const backwardEndC = c - dc * (backwardSteps + 1);
    if (isValid(backwardEndR, backwardEndC) && !board[backwardEndR][backwardEndC].owner) {
        openEnds++;
    }

    return openEnds;
}

/**
 * Check if there's enough space for a 5-piece sequence in this direction
 */
function hasSpaceForFive(board: BoardState, r: number, c: number, dr: number, dc: number, team: Team): boolean {
    let totalSpace = 1; // Count the current position

    // Count forward
    for (let i = 1; i < 5; i++) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (!isValid(nr, nc)) break;
        if (board[nr][nc].owner === team || isCorner(nr, nc) || !board[nr][nc].owner) {
            totalSpace++;
        } else {
            break;
        }
    }

    // Count backward
    for (let i = 1; i < 5; i++) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (!isValid(nr, nc)) break;
        if (board[nr][nc].owner === team || isCorner(nr, nc) || !board[nr][nc].owner) {
            totalSpace++;
        } else {
            break;
        }
    }

    return totalSpace >= 5;
}

function scoreRemoval(board: BoardState, r: number, c: number, _myTeam: Team): number {
    const opponentTeam = board[r][c].owner;
    if (!opponentTeam) return 0;

    // If the piece is locked (part of a completed sequence), NEVER remove it (rules usually say you can't anyway)
    // But checking here just in case logic allows it. The isValid check usually handles this? 
    // Actually the rule is you cannot remove a piece from a COMPLETED sequence. 
    // The board state might track 'isLocked'. 
    if (board[r][c].isLocked) return 0;

    let maxScore = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let [dr, dc] of directions) {
        // We need to evaluate the sequence this piece is part of.
        // We look in both directions to find the full extent of the connected line.

        let lineLength = 1;
        // Check forward
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === opponentTeam || isCorner(nr, nc))) lineLength++;
            else break;
        }
        // Check backward
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === opponentTeam || isCorner(nr, nc))) lineLength++;
            else break;
        }

        // Only score if the sequence is significant
        if (lineLength >= 4) {
            // 1. Check open ends (Verification #1)
            const openEnds = countOpenEnds(board, r, c, dr, dc, opponentTeam);

            // 2. Check Available Space for 5 (Verification #2)
            const hasSpace = hasSpaceForFive(board, r, c, dr, dc, opponentTeam);

            // If BOTH ends are blocked (openEnds == 0) -> Score 0
            // If NO space for 5 -> Score 0
            if (openEnds === 0 || !hasSpace) {
                // Do not add to score, it's a dead line
                continue;
            }

            // If at least one end is open AND there is space for 5
            if (openEnds > 0 && hasSpace) {
                // Priority Total (Verification #1)
                // Returning 1000 ensures this takes priority over almost anything else (preventing a win)
                // We maximize the score for this particular direction
                maxScore = Math.max(maxScore, 1000);
            }

        } else if (lineLength === 3) {
            // For 3-sequences, apply similar logic but lower score
            const openEnds = countOpenEnds(board, r, c, dr, dc, opponentTeam);
            const hasSpace = hasSpaceForFive(board, r, c, dr, dc, opponentTeam);

            if (openEnds > 0 && hasSpace) {
                maxScore = Math.max(maxScore, 50); // Small preventive value
            }
        }
    }

    return maxScore;
}

function isValid(r: number, c: number) {
    return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function isCorner(r: number, c: number) {
    return (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
}
