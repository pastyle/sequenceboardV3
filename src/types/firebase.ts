export type GameStatus = 'waiting' | 'playing' | 'finished';
export type PlayerColor = 'red' | 'blue' | 'green';

// 10x10 matrix of card IDs (or whatever represents a card on the board)
// Assuming string for now (e.g., 'JC', '2H', etc.)
export type BoardMatrix = string[][];

export interface FirestorePlayer {
    uid: string;
    name: string; // "Player 1", "Guest", etc.
    color?: PlayerColor;
    isHost: boolean;
    status: 'online' | 'offline';
    lastSeen: number; // Timestamp for heartbeat
    hand?: string[]; // Array of card IDs
    team?: number; // 1 or 2 (or 3)
}

export interface Room {
    roomId: string; // The generated 6-char code
    createdAt: number; // Timestamp
    createdBy: string; // User UID
}

export interface FirestoreGame {
    id: string; // Firestore Document ID (often same as room code or auto-generated)
    roomId: string; // Readable room code (e.g., 'ABCD')
    status: GameStatus;
    maxPlayers: number; // 2, 3, or 4
    players: { [uid: string]: FirestorePlayer }; // Map UID -> Player Data
    board: BoardMatrix;
    currentTurn: string; // UID of current player
    turnOrder: string[]; // List of UIDs defining the turn sequence
    deck: string[]; // Remaining cards in deck
    lastMove?: {
        playerId: string;
        card: string;
        position: { r: number; c: number };
    };
    winnerTeam?: number;
    createdAt: number;
}
