import React from 'react';
import type { BoardState, Player, CellPosition } from '../types/game.types';
import { BoardCell } from './BoardCell';
import { isValidMove } from '../game/rules';

interface BoardProps {
    board: BoardState;
    currentPlayer: Player;
    selectedCard: string | null;
    winningCells: CellPosition[]; // Cells to highlight as win
    onCellClick: (row: number, col: number) => void;
}

export const Board: React.FC<BoardProps> = ({
    board, currentPlayer, selectedCard, winningCells, onCellClick
}) => {

    const isWinningPos = (r: number, c: number) => {
        return winningCells.some(pos => pos.row === r && pos.col === c);
    };

    return (
        <div className="bg-[#111] p-1 rounded-xl shadow-2xl overflow-hidden aspect-square h-full max-h-[80vh]">
            <div className="grid grid-cols-10 grid-rows-10 gap-1 h-full">
                {board.map((row, rowIndex) => (
                    row.map((cell, colIndex) => {
                        // Calculate validity for highlighting
                        let isValidTarget = false;
                        let isValidRemove = false;

                        if (selectedCard) {
                            const move = isValidMove(selectedCard, rowIndex, colIndex, board, currentPlayer.team);
                            if (move.isValid) {
                                if (move.type === 'place') isValidTarget = true;
                                if (move.type === 'remove') isValidRemove = true;
                            }
                        }

                        return (
                            <BoardCell
                                key={`${rowIndex}-${colIndex}`}
                                row={rowIndex}
                                col={colIndex}
                                card={cell.card}
                                owner={cell.owner}
                                isLocked={cell.isLocked}
                                isWinningCell={isWinningPos(rowIndex, colIndex)}
                                isValidTarget={isValidTarget}
                                isValidRemove={isValidRemove}
                                onClick={() => onCellClick(rowIndex, colIndex)}
                            />
                        );
                    })
                ))}
            </div>
        </div>
    );
};
