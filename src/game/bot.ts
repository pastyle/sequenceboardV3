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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allPlayers: Player[]
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

    // 3. Return best move
    possibleMoves.sort((a, b) => b.score - a.score);

    // Add some randomness if scores are equal or low
    const topScore = possibleMoves[0].score;
    const bestMoves = possibleMoves.filter(m => m.score >= topScore - 10);

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
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

function scoreRemoval(board: BoardState, r: number, c: number, myTeam: Team): number {
    const opponentTeam = board[r][c].owner;
    if (!opponentTeam) return 0;

    let score = 0;
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

    for (let [dr, dc] of directions) {
        let lineLength = 1;
        // Check how long the opponent's line WAS
        // Forward
        for (let i = 1; i < 5; i++) {
            const nr = r + dr * i;
            const nc = c + dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === opponentTeam || isCorner(nr, nc))) lineLength++;
            else break;
        }
        // Backward
        for (let i = 1; i < 5; i++) {
            const nr = r - dr * i;
            const nc = c - dc * i;
            if (isValid(nr, nc) && (board[nr][nc].owner === opponentTeam || isCorner(nr, nc))) lineLength++;
            else break;
        }

        if (lineLength >= 4) score += 200;
        else if (lineLength === 3) score += 50;
    }

    return score;
}

function isValid(r: number, c: number) {
    return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function isCorner(r: number, c: number) {
    return (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
}
