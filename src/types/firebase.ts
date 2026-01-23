export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface Position {
    r: number;
    c: number;
}

export interface Card {
    suit: string;
    rank: string;
    twoEyed: boolean;
    oneEyed: boolean;
}

export interface FirestorePlayer {
    uid: string;
    name: string;
    isHost: boolean;
    status: 'online' | 'offline';
    lastSeen: number;
    team?: number;
    hand?: string[];
    color?: string;
    isBot?: boolean;
}

export interface Move {
    playerId: string;
    position: Position;
    card: string;
    type: 'place' | 'remove';
    timestamp: number;
    removedTeam?: number;
}

export interface FirestoreGame {
    id?: string;
    roomId: string;
    status: GameStatus;
    maxPlayers: number;
    players: Record<string, FirestorePlayer>;
    createdAt: number;
    turnStartedAt?: number;

    // Game State
    board: string[] | number[] | string[][]; // Can be flat array in DB or 2D in memory
    deck: string[];
    discardPile: string[];
    currentTurn?: string; // playerUid
    currentPlayerIndex: number;
    winner: string | null;
    lastMove?: Move;
    winningCells?: any[];
    turnOrder?: string[];
    winnerTeam?: string;
    winningSequence?: Position[];

    // Lobby
    isPrivate?: boolean;
    password?: string;
}
