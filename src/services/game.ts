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
    getDocs,
    limit,
    deleteDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import type { FirestoreGame, GameStatus, FirestorePlayer } from '../types/firebase';

const GAMES_COLLECTION = 'games';

// Helper: Shuffle array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

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

// Check if a game exists by roomId
export const gameExists = async (roomId: string): Promise<boolean> => {
    try {
        const gameRef = doc(db, GAMES_COLLECTION, roomId);
        const gameSnap = await getDoc(gameRef);
        return gameSnap.exists();
    } catch (error) {
        console.error('Error checking game existence:', error);
        return false;
    }
};

// Get basic room information (exists, isPrivate)
export const getRoomInfo = async (roomId: string): Promise<{ exists: boolean; isPrivate: boolean }> => {
    try {
        const gameRef = doc(db, GAMES_COLLECTION, roomId);
        const gameSnap = await getDoc(gameRef);

        if (!gameSnap.exists()) {
            return { exists: false, isPrivate: false };
        }

        const gameData = gameSnap.data() as FirestoreGame;
        return {
            exists: true,
            isPrivate: gameData.isPrivate || false
        };
    } catch (error) {
        console.error('Error getting room info:', error);
        return { exists: false, isPrivate: false };
    }
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
export const createGame = async (
    hostUid: string,
    hostName: string,
    maxPlayers: number = 2,
    isPrivate: boolean = false,
    password?: string
): Promise<string> => {
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
    const newGameData: any = {
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
        isPrivate: isPrivate
    };

    if (isPrivate && password) {
        newGameData.password = password;
    }

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
    const handSize = playerCount <= 3 ? 7 : 6;

    // Assign Teams & Deal Cards
    const updates: any = {};

    // Check if we can reuse existing teams (if player count structure implies same teams)
    // We only reuse if ALL current players already have a team assigned and the team count matches expected
    // Actually, simple heuristic: If everyone has a color, and it's valid for this player count, keep it.
    // For 2 players: teams 1 and 2.
    // For 3 players: teams 1, 2, 3.
    // For 4 players: teams 1 and 2 (2 players each).
    // Let's see if we can just re-shuffle deck and hands, but keep teams/colors.

    let keepTeams = true;
    const currentTeams = new Set<number>();

    // Check validity of current state
    for (const uid of playerUids) {
        const p = gameData.players[uid];
        if (!p.team || !p.color) {
            keepTeams = false;
            break;
        }
        currentTeams.add(p.team);
    }

    if (keepTeams) {
        // Double check team balance specific to player count
        if (playerCount === 2 && currentTeams.size !== 2) keepTeams = false;
        if (playerCount === 3 && currentTeams.size !== 3) keepTeams = false;
        if (playerCount === 4) {
            // Check 2v2 balance
            const team1Count = playerUids.filter(uid => gameData.players[uid].team === 1).length;
            const team2Count = playerUids.filter(uid => gameData.players[uid].team === 2).length;
            if (team1Count !== 2 || team2Count !== 2) keepTeams = false;
        }
    }

    // Determine Turn Order based on alternation
    let turnOrder: string[] = [];

    if (!keepTeams) {
        // RE-ASSIGN TEAMS LOGIC
        if (playerCount === 4) {
            // We want T1, T2, T1, T2
            const redTeam: string[] = [];
            const blueTeam: string[] = [];

            // Simple assignment: First 2 red, next 2 blue (or interleaved?)
            // Let's interleave based on shuffled order or just index
            // Shuffle players for random teams
            const shuffledUids = shuffleArray([...playerUids]);

            shuffledUids.forEach((uid, index) => {
                if (index % 2 === 0) redTeam.push(uid);
                else blueTeam.push(uid);
            });

            // P1(R), P2(B), P3(R), P4(B)
            turnOrder = [redTeam[0], blueTeam[0], redTeam[1], blueTeam[1]];

            // Apply updates
            turnOrder.forEach((uid, index) => {
                const team = (index % 2) + 1; // 1, 2, 1, 2
                updates[`players.${uid}.team`] = team;
                updates[`players.${uid}.color`] = team === 1 ? 'red' : 'blue';
            });
        } else {
            // For 2 or 3 players
            turnOrder = shuffleArray([...playerUids]);
            turnOrder.forEach((uid, index) => {
                let team = 0;
                if (playerCount === 2) team = index === 0 ? 1 : 2;
                else if (playerCount === 3) team = index + 1;

                updates[`players.${uid}.team`] = team;
                updates[`players.${uid}.color`] = team === 1 ? 'red' : (team === 2 ? 'blue' : 'green');
            });
        }
    } else {
        // KEEP TEAMS LOGIC - Just determine turn order respecting alternation
        if (playerCount === 4) {
            const redTeam = playerUids.filter(uid => gameData.players[uid].team === 1);
            const blueTeam = playerUids.filter(uid => gameData.players[uid].team === 2);
            // Shuffle within teams to vary starter?
            const r = shuffleArray(redTeam);
            const b = shuffleArray(blueTeam);
            turnOrder = [r[0], b[0], r[1], b[1]];
        } else {
            // 2 or 3 players, just shuffle turn order?
            // But for 2 players, P1(Red) must play, then P2(Blue). 
            // If we shuffle turn order, we might get Blue then Red? 
            // Actually turn order implies color usually? 
            // "Red starts" is sequence rule.
            // Let's enforce Red starts if possible, or just shuffle.
            // The original code used index to assign team.
            // If we keep teams, we should sort turnOrder by team?
            // Team 1 (Red), Team 2 (Blue), Team 3 (Green).
            // So sort players by team.
            const sortedByTeam = [...playerUids].sort((a, b) => {
                return (gameData.players[a].team || 0) - (gameData.players[b].team || 0);
            });
            turnOrder = sortedByTeam; // 1, 2, 3
        }
    }

    // Deal cards (common for both paths)
    turnOrder.forEach(uid => {
        const hand = deck.splice(0, handSize);
        updates[`players.${uid}.hand`] = hand;
    });

    updates['deck'] = deck;
    updates['discardPile'] = []; // Initialize empty discard pile
    updates['status'] = 'playing';
    updates['turnOrder'] = turnOrder;
    updates['currentTurn'] = turnOrder[0];
    updates['turnStartedAt'] = Date.now();
    updates['board'] = Array(100).fill('');
    updates['winnerTeam'] = deleteField();
    updates['winningSequence'] = deleteField();
    updates['lastMove'] = deleteField(); // Clear last move

    await updateDoc(gameRef, updates);
};

export const joinGame = async (roomId: string, playerUid: string, playerName: string, password?: string): Promise<void> => {
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

    // 3. Check Capacity
    const currentPlayers = Object.keys(gameData.players).length;
    if (currentPlayers >= (gameData.maxPlayers || 4)) {
        throw new Error('Room is full');
    }

    // 4. Check Password if Private
    if (gameData.isPrivate) {
        if (!password || password !== gameData.password) {
            throw new Error('Invalid Password');
        }
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
    winnerTeam?: number,
    winningSequence?: Array<{ row: number; col: number }>
): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');

    const gameData = gameSnap.data() as FirestoreGame;

    // Convert board to flat for update (handle both formats)
    const flatBoard: string[] = Array.isArray(gameData.board[0])
        ? boardToFlat(gameData.board as unknown as string[][])
        : (gameData.board as (string | number)[]).map(String);
    const flatIndex = row * 10 + col;

    // Update board cell
    let removedTeam: number | undefined;
    if (moveType === 'place') {
        flatBoard[flatIndex] = team; // Store team color as marker
    } else {
        // Capture who we are removing
        const cellValue = flatBoard[flatIndex];
        // cellValue strings are 'red', 'blue', 'green'. Map back to team ID?
        // Or just store the string. Frontend compares with localPlayer.team (number). 
        // localPlayer.color is string (red/blue). 
        // Wait, flatBoard stores 'red'/'blue' strings? 
        // Let's check: updates[`players.${uid}.color`] = ... 'red'
        // In startGame: teamId is 1, 2. 
        // In makeMove: flatBoard[flatIndex] = team. 
        // Arguments to makeMove: team: string. 
        // So board stores what comes in `team`.
        // In BoardCell.tsx, it likely renders based on this string.
        // So `removedTeam` here will be a string like 'red', 'blue'.
        // Frontend localPlayer has .team (number) and .color (string). 
        // My App.tsx logic: const amIVictim = myTeam && removedTeam && myTeam === removedTeam;
        // myTeam is number. removedTeam will be string. Mismatch!
        // I should probably convert string back to team number or consistency.
        // OR update App.tsx to compare colors. 
        // But let's check what `team` param is in makeMove. 
        // It is passed from frontend.
        // In startGame, we set `players.${uid}.color` = 'red'.
        // So board stores 'red'. 
        // App.tsx uses `localPlayer.team` (number). 
        // I should store `removedTeam` as the NUMBER in lastMove if possible, OR string.
        // It's easier to verify string vs string. 
        // Let's see map:
        // red -> 1, blue -> 2, green -> 3.
        if (cellValue === 'red') removedTeam = 1;
        else if (cellValue === 'blue') removedTeam = 2;
        else if (cellValue === 'green') removedTeam = 3;

        flatBoard[flatIndex] = ''; // Remove marker
    }

    // Get player's hand and remove used card
    const playerHand = [...(gameData.players[playerUid].hand || [])];
    const cardIndex = playerHand.indexOf(cardUsed);
    if (cardIndex > -1) {
        playerHand.splice(cardIndex, 1);
    }

    // Smart card drawing with discard pile reshuffling
    let newDeck = [...gameData.deck];
    let newDiscardPile = [...(gameData.discardPile || [])];

    // Add used card to discard pile
    newDiscardPile.push(cardUsed);

    // Draw new card - reshuffle discard pile if main deck is empty
    if (newDeck.length > 0) {
        // Main deck has cards, draw from it
        playerHand.push(newDeck.pop()!);
    } else if (newDiscardPile.length > 0) {
        // Main deck empty! Reshuffle discard pile
        console.log('[DECK] Main deck empty, reshuffling discard pile with', newDiscardPile.length, 'cards');
        newDeck = shuffleArray(newDiscardPile);
        newDiscardPile = [];

        if (newDeck.length > 0) {
            playerHand.push(newDeck.pop()!);
        }
    }
    // If both decks empty, player continues with current hand (stalemate check happens elsewhere)

    // Get next player from turnOrder
    const turnOrder = gameData.turnOrder || Object.keys(gameData.players).sort();
    const currentIndex = turnOrder.indexOf(playerUid);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    const nextPlayerUid = turnOrder[nextIndex];

    const updates: any = {
        board: flatBoard,
        deck: newDeck,
        discardPile: newDiscardPile,
        [`players.${playerUid}.hand`]: playerHand,
        currentTurn: nextPlayerUid,
        turnStartedAt: Date.now(),
        lastMove: {
            playerId: playerUid,
            card: cardUsed,
            position: { r: row, c: col },
            type: moveType,
            ...(removedTeam !== undefined && { removedTeam })
        }
    };

    if (winnerTeam) {
        updates.winnerTeam = winnerTeam;
        updates.status = 'finished';

        // Store winning sequence so all players can see it
        if (winningSequence) {
            updates.winningSequence = winningSequence.map(cell => ({ r: cell.row, c: cell.col }));
        }
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

            callback({
                ...data as FirestoreGame,
                id: doc.id,
                board: board,
                discardPile: data.discardPile || []
            });
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

export const discardCard = async (
    roomId: string,
    playerUid: string,
    cardToDiscard: string
): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) throw new Error('Game not found');

    const gameData = gameSnap.data() as FirestoreGame;

    // Remove card from hand
    const playerHand = [...(gameData.players[playerUid].hand || [])];
    const cardIndex = playerHand.indexOf(cardToDiscard);
    if (cardIndex > -1) {
        playerHand.splice(cardIndex, 1);
    }

    // Smart card drawing with discard pile reshuffling (same logic as makeMove)
    let newDeck = [...gameData.deck];
    let newDiscardPile = [...(gameData.discardPile || [])];
    newDiscardPile.push(cardToDiscard);

    // Draw replacement card
    if (newDeck.length > 0) {
        playerHand.push(newDeck.pop()!);
    } else if (newDiscardPile.length > 0) {
        console.log('[DISCARD] Main deck empty, reshuffling discard pile');
        newDeck = shuffleArray(newDiscardPile);
        newDiscardPile = [];
        if (newDeck.length > 0) {
            playerHand.push(newDeck.pop()!);
        }
    }

    // Advance turn to next player
    const turnOrder = gameData.turnOrder || Object.keys(gameData.players);
    const currentIndex = turnOrder.indexOf(playerUid);
    const nextIndex = (currentIndex + 1) % turnOrder.length;

    await updateDoc(gameRef, {
        deck: newDeck,
        discardPile: newDiscardPile,
        [`players.${playerUid}.hand`]: playerHand,
        currentTurn: turnOrder[nextIndex],
        turnStartedAt: Date.now()
    });
};

export const promoteNewHost = async (roomId: string): Promise<void> => {
    const gameRef = doc(db, GAMES_COLLECTION, roomId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) return;

    const gameData = gameSnap.data() as FirestoreGame;
    const playerUids = Object.keys(gameData.players);

    // Check if we even have a host
    const currentHost = playerUids.find(uid => gameData.players[uid].isHost);

    if (!currentHost && playerUids.length > 0) {
        // No host! Promote first player in turnOrder or first available
        const newHostUid = gameData.turnOrder?.[0] || playerUids[0];

        console.log(`[HOST MIGRATION] Promoting ${gameData.players[newHostUid]?.name} to host`);

        await updateDoc(gameRef, {
            [`players.${newHostUid}.isHost`]: true
        });
    }
};

export const listActiveGames = (callback: (games: FirestoreGame[]) => void) => {
    // Note: Removed orderBy('createdAt', 'desc') to avoid requiring a composite index in Firestore.
    // We sort client-side instead.
    const q = query(
        collection(db, GAMES_COLLECTION),
        where('status', '==', 'waiting'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const games: FirestoreGame[] = [];
        const now = Date.now();
        const MAX_INACTIVITY = 10 * 60 * 1000; // 10 minutes

        snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FirestoreGame;

            // Check for abandonment
            const players = data.players || {};
            const playerUids = Object.keys(players);

            // 1. No players at all
            if (playerUids.length === 0) {
                // Delete empty room
                deleteDoc(docSnap.ref).catch(console.error);
                return; // Skip adding to list
            }

            // 2. Host inactive for too long
            const host = Object.values(players).find(p => p.isHost);
            if (host && host.lastSeen && (now - host.lastSeen > MAX_INACTIVITY)) {
                // Delete abandoned room
                deleteDoc(docSnap.ref).catch(console.error);
                return; // Skip adding to list
            }

            // Convert flat board to 2D
            const board = Array.isArray(data.board) ? flatToBoard(data.board as string[]) : [];

            games.push({
                ...data,
                id: docSnap.id,
                board: board,
                discardPile: data.discardPile || []
            });
        });

        // Client-side sort: Newest first
        games.sort((a, b) => b.createdAt - a.createdAt);

        callback(games);
    });
};

// DEV ONLY: Clear all games
export const deleteAllGames = async () => {
    const q = query(collection(db, GAMES_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
};
