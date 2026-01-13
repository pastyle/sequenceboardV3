export type Suit = '♠' | '♣' | '♥' | '♦';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'Q' | 'K' | 'A';
export type Team = 'red' | 'blue'; // 'green' for 3 players later?

export interface Player {
    id: number;
    name: string;
    team: Team;
    hand: string[]; // e.g. "2♠"
}

export interface CellPosition {
    row: number;
    col: number;
}

export interface BoardCellState {
    card: string;
    owner: Team | null;
    isLocked: boolean; // Part of a sequence?
}

export type BoardState = BoardCellState[][];

export interface GameState {
    deck: string[];
    players: Player[];
    currentPlayerIndex: number;
    board: BoardState;
    selectedCardIndex: number; // -1 if none
    winner: Team | null;
    winningCells: CellPosition[]; // Highlight winning sequence
}

export type JackType = 'one-eyed' | 'two-eyed' | 'normal';
