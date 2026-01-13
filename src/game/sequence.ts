import type { BoardState, Team, CellPosition } from '../types/game.types';

export function checkWin(boardState: BoardState, lastMove: { row: number, col: number }, team: Team): { isWin: boolean; sequence: CellPosition[] } {
    const { row, col } = lastMove;
    const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (let [dr, dc] of directions) {
        let count = 1; // Start with placed piece
        let sequenceCells: CellPosition[] = [{ row, col }];

        // Check Forward
        for (let i = 1; i < 5; i++) {
            const r = row + (dr * i);
            const c = col + (dc * i);
            if (isValidCell(r, c) && isTeamOrCorner(r, c, team, boardState)) {
                count++;
                sequenceCells.push({ row: r, col: c });
            } else {
                break;
            }
        }

        // Check Backward
        for (let i = 1; i < 5; i++) {
            const r = row - (dr * i);
            const c = col - (dc * i);
            if (isValidCell(r, c) && isTeamOrCorner(r, c, team, boardState)) {
                count++;
                sequenceCells.push({ row: r, col: c });
            } else {
                break;
            }
        }

        if (count >= 5) {
            return { isWin: true, sequence: sequenceCells };
        }
    }
    return { isWin: false, sequence: [] };
}

function isValidCell(r: number, c: number): boolean {
    return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function isTeamOrCorner(r: number, c: number, team: Team, boardState: BoardState): boolean {
    const isCorner = (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
    // Legacy logic: Corner checks JUST coordinate.
    // Note: If boardState has a marker, it matches team. If corner, it matches automatically (wild).
    const cellOwner = boardState[r][c].owner;
    return cellOwner === team || isCorner;
}
