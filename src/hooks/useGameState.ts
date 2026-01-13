import { useEffect, useReducer, useCallback, useState } from 'react';
import type { GameState, BoardState, Team, Player, CellPosition } from '../types/game.types';
import type { FirestoreGame } from '../types/firebase';
import { createDeck } from '../game/deck';
import { BOARD_MATRIX, CARDS_PER_PLAYER } from '../game/constants';
import { isValidMove } from '../game/rules';
import { checkWin } from '../game/sequence';

const INITIAL_PLAYERS: Player[] = [
    { id: 1, name: 'Player 1', team: 'red', hand: [] },
    { id: 2, name: 'Player 2', team: 'blue', hand: [] }
];

// Helper to init board
const createInitialBoard = (): BoardState => {
    return BOARD_MATRIX.map(row =>
        row.map(cardVal => ({
            card: cardVal,
            owner: null,
            isLocked: false
        }))
    );
};

const createInitialState = (): GameState => {
    const deck = createDeck();
    const players = JSON.parse(JSON.stringify(INITIAL_PLAYERS)); // Deep copy

    // Deal cards
    players.forEach((player: Player) => {
        for (let i = 0; i < CARDS_PER_PLAYER; i++) {
            if (deck.length > 0) player.hand.push(deck.pop()!);
        }
    });

    return {
        deck,
        players,
        currentPlayerIndex: 0,
        board: createInitialBoard(),
        selectedCardIndex: -1,
        winner: null,
        winningCells: []
    };
};

type Action =
    | { type: 'SELECT_CARD'; index: number }
    | { type: 'PLACE_MARKER'; row: number; col: number; team: Team }
    | { type: 'REMOVE_MARKER'; row: number; col: number }
    | { type: 'FINISH_TURN' }
    | { type: 'SET_WINNER'; team: Team; sequence: CellPosition[] }
    | { type: 'RESET_GAME' }
    | { type: 'REMOVE_MARKER'; row: number; col: number }
    | { type: 'FINISH_TURN' }
    | { type: 'SET_WINNER'; team: Team; sequence: CellPosition[] }
    | { type: 'RESET_GAME' }
    | { type: 'SETUP_WIN_SCENARIO' }
    | { type: 'SYNC_GAME_DATA'; game: FirestoreGame; currentUserUid: string };

function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
        case 'SELECT_CARD':
            return {
                ...state,
                selectedCardIndex: state.selectedCardIndex === action.index ? -1 : action.index
            };

        case 'PLACE_MARKER': {
            const newBoard = [...state.board];
            newBoard[action.row] = [...newBoard[action.row]];
            newBoard[action.row][action.col] = {
                ...newBoard[action.row][action.col],
                owner: action.team
            };
            return { ...state, board: newBoard };
        }

        case 'REMOVE_MARKER': {
            const newBoard = [...state.board];
            newBoard[action.row] = [...newBoard[action.row]];
            newBoard[action.row][action.col] = {
                ...newBoard[action.row][action.col],
                owner: null
            };
            return { ...state, board: newBoard };
        }

        case 'FINISH_TURN': {
            const currentPlayer = state.players[state.currentPlayerIndex];
            const newPlayers = [...state.players];
            const newDeck = [...state.deck];

            // Remove used card
            // const usedCard = currentPlayer.hand[state.selectedCardIndex]; // Unused
            const newHand = currentPlayer.hand.filter((_, i) => i !== state.selectedCardIndex);

            // Draw new card
            if (newDeck.length > 0) {
                newHand.push(newDeck.pop()!);
            }

            newPlayers[state.currentPlayerIndex] = {
                ...currentPlayer,
                hand: newHand
            };

            return {
                ...state,
                players: newPlayers,
                deck: newDeck,
                currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
                selectedCardIndex: -1 // Reset selection
            };
        }

        case 'SET_WINNER':
            return {
                ...state,
                winner: action.team,
                winningCells: action.sequence,
                selectedCardIndex: -1
            };

        case 'RESET_GAME':
            return createInitialState();

        case 'SETUP_WIN_SCENARIO': {
            const newState = createInitialState();
            // Setup Horizontal Win for Player 1 (Red)
            // Row 1: 5♣(1,1) 4♣(1,2) 3♣(1,3) 2♣(1,4) -> Need A♥(1,5)
            const row = 1;
            for (let col = 1; col <= 4; col++) {
                newState.board[row][col].owner = 'red';
            }
            // Give Player 1 the winning card
            newState.players[0].hand[0] = 'A♥';
            newState.players[0].hand[1] = 'J♠'; // One-eyed (Remove)
            newState.players[0].hand[2] = 'J♣'; // Two-eyed (Wild)

            return newState;
        }

        case 'SYNC_GAME_DATA': {
            const { game } = action;

            // Map Firestore Players to Local Players
            const sortedUid = Object.keys(game.players).sort(); // Sort logic should match creation/join order ideally. 
            // In services/game.ts we used order of keys for dealing. 
            // Let's assume consistent order or we map by UID.
            // Actually, we need to map the 'players' array index to the turn order.

            const newPlayers: Player[] = sortedUid.map((uid, index) => {
                const fsPlayer = game.players[uid];
                return {
                    id: index + 1, // ID 1..N
                    name: fsPlayer.name,
                    team: (fsPlayer.color || (index % 2 === 0 ? 'red' : 'blue')) as Team, // Fallback if color missing
                    hand: fsPlayer.hand || [],
                    uid: uid // Add UID to Player type? Or just map?
                };
            });

            // Reconstruct Board
            const newBoard = createInitialBoard();
            game.board.forEach((row, r) => {
                row.forEach((cell, c) => {
                    if (cell) {
                        // Assuming cell string is either Card ID or "Team:CardID" or similar?
                        // Actually, board storage is Flat, converted to 2D in hook.
                        // But what does the string contain? 'JC', '2H'?
                        // And owner? 
                        // Wait, Firestore Board only stores strings? 
                        // The Local Board stores { card, owner, isLocked }.
                        // Firestore Board is `string[][]`. usage: `board[r][c]`.
                        // If it's just the card ID, where is ownership stored?
                        // Ah, `services/game.ts` init board with `''`.
                        // When placing marker, we need to store WHO owns it.
                        // Firestore definition: `board: BoardMatrix` (string[][]).
                        // Problem: The current Firestore schema only stores STRINGS in the board cells.
                        // It does NOT store ownership.
                        // WE NEED TO UPDATE FIRESTORE SCHEMA TO STORE BOARD CELL STATE (Owner + Card).
                        // OR (Simple version logic): The board matrix in constants.ts DEFINES the card at (r,c).
                        // The Firestore state needs to track OWNERSHIP.
                        // Current `game.ts`: `board: Array(100).fill('')`. use `flatToBoard`.
                        // If the cell is empty string, no marker.
                        // If cell has "red", it's red?
                        // BUT we also need to know the CARD layout? The card layout is STATIC (constants.ts).
                        // So Firestore only needs to store the MARKERS (who owns the cell).
                    }
                    // Implement mapping:
                    // If Firestore cell === 'red' -> owner = 'red'
                    // If Firestore cell === 'blue' -> owner = 'blue'
                    // If Firestore cell === '' -> owner = null
                    // The CARD identity comes from BOARD_MATRIX constant.

                    const marker = cell as Team | '';
                    if (marker) {
                        newBoard[r][c].owner = marker;
                    }
                });
            });

            // Current Turn Index
            const currentTurnIndex = sortedUid.indexOf(game.currentTurn);

            return {
                ...state,
                players: newPlayers,
                deck: game.deck,
                board: newBoard,
                currentPlayerIndex: currentTurnIndex !== -1 ? currentTurnIndex : 0,
                winner: game.winnerTeam ? (game.winnerTeam === 1 ? 'red' : 'blue') : null, // Naive mapping
                // winningCells? If we want highlight, maybe store it or recalc
            };
        }

        default:
            return state;
    }
}

export function useGameState(game?: FirestoreGame | null, currentUserUid?: string) {
    const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
    const [turnError, setTurnError] = useState<string | null>(null);

    // Sync Effect
    useEffect(() => {
        if (game && currentUserUid) {
            dispatch({ type: 'SYNC_GAME_DATA', game, currentUserUid });
        }
    }, [game, currentUserUid]);

    // Check if it's the current user's turn
    const isMyTurn = useCallback(() => {
        if (!game || !currentUserUid) return false;
        return game.currentTurn === currentUserUid;
    }, [game, currentUserUid]);

    const handleCardClick = useCallback((index: number) => {
        if (state.winner) return;

        if (!isMyTurn()) {
            setTurnError('NÃO É A SUA VEZ');
            setTimeout(() => setTurnError(null), 2000);
            return;
        }

        dispatch({ type: 'SELECT_CARD', index });
    }, [state.winner, isMyTurn]);

    const handleBoardClick = useCallback(async (row: number, col: number) => {
        if (state.winner || state.selectedCardIndex === -1) return;

        if (!isMyTurn()) {
            setTurnError('NÃO É A SUA VEZ');
            setTimeout(() => setTurnError(null), 2000);
            return;
        }

        const currentPlayer = state.players[state.currentPlayerIndex];
        const selectedCard = currentPlayer.hand[state.selectedCardIndex];

        const move = isValidMove(selectedCard, row, col, state.board, currentPlayer.team);

        if (move.isValid && game && currentUserUid) {
            try {
                // Import makeMove dynamically
                const { makeMove } = await import('../services/game');

                if (move.type === 'place') {
                    // Check win before making move
                    const nextBoard = state.board.map(r => r.map(c => ({ ...c })));
                    nextBoard[row][col].owner = currentPlayer.team;
                    const winResult = checkWin(nextBoard, { row, col }, currentPlayer.team);

                    // Make move in Firestore
                    await makeMove(
                        game.roomId,
                        currentUserUid,
                        row,
                        col,
                        currentPlayer.team,
                        selectedCard,
                        'place'
                    );

                    // If win, update locally (Firestore sync will handle propagation)
                    if (winResult.isWin) {
                        dispatch({ type: 'SET_WINNER', team: currentPlayer.team, sequence: winResult.sequence });
                    }

                } else if (move.type === 'remove') {
                    await makeMove(
                        game.roomId,
                        currentUserUid,
                        row,
                        col,
                        currentPlayer.team,
                        selectedCard,
                        'remove'
                    );
                }

                // Deselect card after move
                dispatch({ type: 'SELECT_CARD', index: -1 });

            } catch (err) {
                console.error('Failed to make move:', err);
            }
        }
    }, [state.winner, state.selectedCardIndex, state.players, state.board, state.currentPlayerIndex, isMyTurn, game, currentUserUid, dispatch]);

    const resetGame = useCallback(() => {
        dispatch({ type: 'RESET_GAME' });
    }, []);

    const setupWinScenario = useCallback(() => {
        dispatch({ type: 'SETUP_WIN_SCENARIO' });
    }, []);

    return {
        state,
        handleCardClick,
        handleBoardClick,
        resetGame,
        setupWinScenario,
        turnError,
        isMyTurn: isMyTurn()
    };
}
