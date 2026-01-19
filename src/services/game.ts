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
        lastSeen: Date.now(),
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

    // Determine Turn Order based on alternation
    let turnOrder: string[] = [];
    if (playerCount === 4) {
        // We want T1, T2, T1, T2
        const redTeam: string[] = [];
        const blueTeam: string[] = [];

        playerUids.forEach((uid, index) => {
            if (index % 2 === 0) redTeam.push(uid);
            else blueTeam.push(uid);
        });

        // P1(R), P2(B), P3(R), P4(B)
        turnOrder = [redTeam[0], blueTeam[0], redTeam[1], blueTeam[1]];
    } else {
        // For 2 or 3 players, order of joining is fine
        turnOrder = [...playerUids];
    }

    turnOrder.forEach((uid, index) => {
        // 0-indexed index in turnOrder
        let team = 0;

        if (playerCount === 2) {
            // P1 -> Red(1), P2 -> Blue(2)
            team = index === 0 ? 1 : 2;
        } else if (playerCount === 3) {
            // P1 -> Red(1), P2 -> Blue(2), P3 -> Green(3)
            team = index + 1;
        } else if (playerCount === 4) {
            // Alternation: R, B, R, B
            team = (index % 2) + 1;
        }

        // Deal cards
        const hand = deck.splice(0, handSize);

        updates[`players.${uid}.team`] = team;
        updates[`players.${uid}.hand`] = hand;
        updates[`players.${uid}.color`] = team === 1 ? 'red' : (team === 2 ? 'blue' : 'green');
    });

    updates['deck'] = deck;
    updates['status'] = 'playing';
    updates['turnOrder'] = turnOrder;
    updates['currentTurn'] = turnOrder[0];
    updates['turnStartedAt'] = Date.now();
    updates['board'] = Array(100).fill('');
    updates['winnerTeam'] = deleteField();

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

    // Debugging Login
    console.log("Attempting Join/Reconnect:", {
        roomId,
        myUid: playerUid,
        gameStatus: gameData.status,
        existingPlayers: Object.keys(gameData.players)
    });

    // 1. Check if player is ALREADY in the game (Reconnect)
    if (gameData.players[playerUid]) {
        console.log("Reconnect Successful for UID:", playerUid);
        // Player already in game, update status if needed
        await updateDoc(gameRef, {
            [`players.${playerUid}.status`]: 'online',
            [`players.${playerUid}.lastSeen`]: Date.now()
        });
        return;
    }

    // 2. If new player, game must be 'waiting'
    if (gameData.status !== 'waiting') {
        throw new Error('Game is defined as already playing or finished');
    }

    // Add new player
    const newPlayer: FirestorePlayer = {
        uid: playerUid,
        name: playerName,
        isHost: false,
        status: 'online',
        lastSeen: Date.now(),
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
    moveType: 'place' | 'remove',
    winnerTeam?: number
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
    const playerHand = [...(gameData.players[playerUid].hand || [])];
    const cardIndex = playerHand.indexOf(cardUsed);
    if (cardIndex > -1) {
        playerHand.splice(cardIndex, 1);
    }

    // Draw new card from deck
    const newDeck = [...gameData.deck];
    if (newDeck.length > 0) {
        playerHand.push(newDeck.pop()!);
    }

    // Get next player from turnOrder
    const turnOrder = gameData.turnOrder || Object.keys(gameData.players).sort();
    const currentIndex = turnOrder.indexOf(playerUid);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerUid = turnOrder[nextIndex];

    const updates: any = {
        board: flatBoard,
        deck: newDeck,
        [`players.${playerUid}.hand`]: playerHand,
        currentTurn: nextPlayerUid,
        turnStartedAt: Date.now(),
        lastMove: {
            playerId: playerUid,
            card: cardUsed,
            position: { r: row, c: col }
        }
    };

    if (winnerTeam) {
        updates.winnerTeam = winnerTeam;
        updates.status = 'finished';
    }

    // Update Firestore
    await updateDoc(gameRef, updates);
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

export const updateHeartbeat = async (roomId: string, playerUid: string): Promise<void> => {
    // We use a light update just for the timestamp
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    await updateDoc(gameRef, {
        [`players.${playerUid}.lastSeen`]: Date.now(),
        [`players.${playerUid}.status`]: 'online'
    });
};

export const setPlayerOffline = async (roomId: string, playerUid: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    await updateDoc(gameRef, {
        [`players.${playerUid}.status`]: 'offline'
    });
};

export const removePlayer = async (roomId: string, playerUid: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    await updateDoc(gameRef, {
        [`players.${playerUid}`]: deleteField()
    });
};




export const setPlayerBot = async (roomId: string, playerUid: string, isBot: boolean): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    await updateDoc(gameRef, {
        [`players.${playerUid}.isBot`]: isBot
    });
};
