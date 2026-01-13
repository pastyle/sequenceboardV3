import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    onSnapshot,
    deleteField,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import type { FirestoreGame, GameStatus, FirestorePlayer } from '../types/firebase';

const GAMES_COLLECTION = 'games';

// Helper to generate a 6-character room code
export const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Check if a room code already exists to avoid collisions
const isRoomCodeAvailable = async (code: string): Promise<boolean> => {
    const q = query(collection(db, GAMES_COLLECTION), where('roomId', '==', code));
    const snapshot = await getDocs(q);
    return snapshot.empty;
};

// Helper to convert 10x10 matrix to flat string array
export const boardToFlat = (board: string[][]): string[] => {
    return board.flat();
};

// Helper to convert flat string array to 10x10 matrix
const flatToBoard = (flat: string[]): string[][] => {
    const board: string[][] = [];
    for (let i = 0; i < 100; i += 10) {
        board.push(flat.slice(i, i + 10));
    }
    return board;
};

// Helper to generate full deck
const generateDeck = (): string[] => {
    const suits = ['♠', '♣', '♥', '♦']; // Spades, Clubs, Hearts, Diamonds
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck: string[] = [];
    // Two full decks
    for (let i = 0; i < 2; i++) {
        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push(rank + suit);
            }
        }
    }
    return deck;
};

// Start: createGame
export const createGame = async (hostUid: string, hostName: string, maxPlayers: number = 2): Promise<string> => {
    let roomId = generateRoomCode();
    let available = await isRoomCodeAvailable(roomId);

    // Simple retry loop for collisions
    while (!available) {
        roomId = generateRoomCode();
        available = await isRoomCodeAvailable(roomId);
    }

    const initialPlayer: FirestorePlayer = {
        uid: hostUid,
        name: hostName,
        isHost: true,
        status: 'online',
        // Team and hand will be set later when game starts
    };

    // Note: We store the board as a flat array in Firestore
    const newGameData = {
        roomId: roomId,
        status: 'waiting',
        maxPlayers: maxPlayers,
        players: {
            [hostUid]: initialPlayer
        },
        board: Array(100).fill(''), // Flat board in storage
        currentTurn: '',
        deck: [],
        createdAt: Date.now(),
    };

    // We write to document with ID = roomId
    await setDoc(doc(db, GAMES_COLLECTION, roomId), newGameData);

    return roomId;
};

export const startGame = async (roomId: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');

    const gameData = gameSnap.data() as FirestoreGame;
    const playerUids = Object.keys(gameData.players);
    const playerCount = playerUids.length;

    if (playerCount < 2 || playerCount > 4) {
        throw new Error(`Invalid player count: ${playerCount}`);
    }

    // Shuffle Deck
    let deck = generateDeck();
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    // Determine hand size
    // 2 players: 7 cards
    // 3 players: 6 cards (standard rules usually say 6 for 3 players? User said 7 for 2-3, but 6 for 4. I will follow user req: 7 for 2-3, 6 for 4)
    const handSize = playerCount <= 3 ? 7 : 6;

    // Assign Teams & Deal Cards
    const updates: any = {};

    // Sorting UIDs to ensure deterministic order if needed, or just use keys order
    // Let's use the order they joined? Keys are unordered. 
    // Ideally we should sort by join time if tracked, but for now just random/keys order.

    playerUids.forEach((uid, index) => {
        // 0-indexed index
        let team = 0;

        if (playerCount === 2) {
            // P1(0) -> Red(1), P2(1) -> Blue(2)
            team = index === 0 ? 1 : 2;
        } else if (playerCount === 3) {
            // P1 -> Red(1), P2 -> Blue(2), P3 -> Green(3)
            team = index + 1;
        } else if (playerCount === 4) {
            // P1(0) -> Red(1)
            // P2(1) -> Blue(2)
            // P3(2) -> Red(1)
            // P4(3) -> Blue(2)
            team = (index % 2) + 1;
        }

        // Deal cards
        const hand = deck.splice(0, handSize);

        updates[`players.${uid}.team`] = team;
        updates[`players.${uid}.hand`] = hand;
        updates[`players.${uid}.color`] = team === 1 ? 'red' : (team === 2 ? 'blue' : (team === 3 ? 'green' : 'yellow'));
    });

    updates['deck'] = deck;
    updates['status'] = 'playing';
    // Set first player (Key at index 0)
    updates['currentTurn'] = playerUids[0];

    await updateDoc(gameRef, updates);
};

export const joinGame = async (roomId: string, playerUid: string, playerName: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
        throw new Error('Game not found');
    }

    // We only read status/players here, so exact board shape doesn't matter for this check
    // But for type safety, let's treat it as any or partial
    const gameData = gameSnap.data();

    if (gameData.status !== 'waiting') {
        throw new Error('Game is defined as already playing or finished');
    }

    if (gameData.players[playerUid]) {
        // Player already in game, update status if needed
        await updateDoc(gameRef, {
            [`players.${playerUid}.status`]: 'online'
        });
        return;
    }

    // Add new player
    const newPlayer: FirestorePlayer = {
        uid: playerUid,
        name: playerName,
        isHost: false,
        status: 'online',
    };

    await updateDoc(gameRef, {
        [`players.${playerUid}`]: newPlayer
    });
};

export const leaveGame = async (roomId: string, playerUid: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);

    await updateDoc(gameRef, {
        [`players.${playerUid}`]: deleteField()
    });
};

export const updateGameStatus = async (roomId: string, status: GameStatus): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    await updateDoc(gameRef, { status });
};

export const makeMove = async (
    roomId: string,
    playerUid: string,
    row: number,
    col: number,
    team: string,
    cardUsed: string,
    moveType: 'place' | 'remove'
): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');

    const gameData = gameSnap.data() as FirestoreGame;

    // Convert board to flat for update
    const flatBoard = boardToFlat(gameData.board);
    const flatIndex = row * 10 + col;

    // Update board cell
    if (moveType === 'place') {
        flatBoard[flatIndex] = team; // Store team color as marker
    } else {
        flatBoard[flatIndex] = ''; // Remove marker
    }

    // Get player's hand and remove used card
    const playerHand = gameData.players[playerUid].hand || [];
    const newHand = playerHand.filter(card => card !== cardUsed);

    // Draw new card from deck
    const newDeck = [...gameData.deck];
    if (newDeck.length > 0) {
        newHand.push(newDeck.pop()!);
    }

    // Get next player
    const playerUids = Object.keys(gameData.players).sort();
    const currentIndex = playerUids.indexOf(playerUid);
    const nextIndex = (currentIndex + 1) % playerUids.length;
    const nextPlayerUid = playerUids[nextIndex];

    // Update Firestore
    await updateDoc(gameRef, {
        board: flatBoard,
        deck: newDeck,
        [`players.${playerUid}.hand`]: newHand,
        currentTurn: nextPlayerUid,
        lastMove: {
            playerId: playerUid,
            card: cardUsed,
            position: { r: row, c: col }
        }
    });
};

export const subscribeToGame = (roomId: string, callback: (game: FirestoreGame | null) => void) => {
    return onSnapshot(doc(db, GAMES_COLLECTION, roomId), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            // Convert flat board to 2D
            const board = Array.isArray(data.board) ? flatToBoard(data.board) : [];

            const game: FirestoreGame = {
                id: doc.id,
                ...data,
                board: board
            } as FirestoreGame;

            callback(game);
        } else {
            callback(null);
        }
    });
};


