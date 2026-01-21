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
    team?: string;
    hand?: string[];
}

export interface Move {
    playerId: string;
    position: Position;
    card: string;
    type: 'place' | 'remove';
    timestamp: number;
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
    board: string[] | number[]; // It's usually a flat array in DB
    deck: string[];
    discardPile: string[];
    currentTurn?: string; // playerUid
    currentPlayerIndex: number;
    winner: string | null;
    lastMove?: Move;
    winningCells?: any[];

    // Lobby
    isPrivate?: boolean;
    password?: string;
}
