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
            const row = 1;
            for (let col = 1; col <= 4; col++) {
                newState.board[row][col].owner = 'red';
            }
            newState.players[0].hand[0] = 'A♥';
            newState.players[0].hand[1] = 'J♠';
            newState.players[0].hand[2] = 'J♣';

            return newState;
        }

        case 'SYNC_GAME_DATA': {
            const { game } = action;

            // Use turnOrder as top-level source of truth for player sequence
            const playerUids = game.turnOrder || Object.keys(game.players).sort();

            const newPlayers: Player[] = playerUids.map((uid, index) => {
                const fsPlayer = game.players[uid];
                return {
                    id: index + 1,
                    name: fsPlayer.name,
                    team: (fsPlayer.color || (index % 2 === 0 ? 'red' : 'blue')) as Team,
                    hand: fsPlayer.hand || [],
                    uid: uid,
                    isHost: fsPlayer.isHost,
                    connectionStatus: fsPlayer.status
                };
            });

            const newBoard = createInitialBoard();
            game.board.forEach((row, r) => {
                row.forEach((cell, c) => {
                    const marker = cell as Team | '';
                    if (marker) {
                        newBoard[r][c].owner = marker;
                    }
                });
            });

            const currentTurnIndex = playerUids.indexOf(game.currentTurn);
            const teamColorMap: Record<number, Team> = { 1: 'red', 2: 'blue', 3: 'green' };

            return {
                ...state,
                players: newPlayers,
                deck: game.deck,
                board: newBoard,
                currentPlayerIndex: currentTurnIndex !== -1 ? currentTurnIndex : 0,
                winner: game.winnerTeam ? teamColorMap[game.winnerTeam] : null,
            };
        }

        default:
            return state;
    }
}

// Timeout constants
const OFFLINE_THRESHOLD_MS = 15000; // 15s without heartbeat -> offline
const REMOVE_THRESHOLD_MS = 60000; // 60s without heartbeat -> remove

export function useGameState(game?: FirestoreGame | null, currentUserUid?: string) {
    const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
    const [turnError, setTurnError] = useState<string | null>(null);

    // Monitor Players (Host Only)
    useEffect(() => {
        if (!game || !currentUserUid) return;

        const myPlayer = game.players[currentUserUid];
        if (!myPlayer?.isHost) return;

        const intervalId = setInterval(() => {
            const now = Date.now();
            Object.values(game.players).forEach(async (player) => {
                if (player.uid === currentUserUid) return; // Don't check self

                // Skip if we don't have a lastSeen yet (recently joined)
                if (!player.lastSeen) return;

                const timeSinceLastSeen = now - player.lastSeen;

                // 1. Mark offline if > 15s and currently online
                if (timeSinceLastSeen > OFFLINE_THRESHOLD_MS && player.status === 'online') {
                    // Import dynamically to avoid circular deps if needed, though useGameState is higher level usually
                    try {
                        const { setPlayerOffline } = await import('../services/game');
                        await setPlayerOffline(game.roomId, player.uid);
                    } catch (e) { console.error("Error setting offline", e) }
                }

                // 2. Remove if > 60s
                if (timeSinceLastSeen > REMOVE_THRESHOLD_MS) {
                    try {
                        const { removePlayer } = await import('../services/game');
                        await removePlayer(game.roomId, player.uid);
                    } catch (e) { console.error("Error removing player", e) }
                }
            });
        }, 5000);

        return () => clearInterval(intervalId);

    }, [game, currentUserUid]);

    useEffect(() => {
        if (game && currentUserUid) {
            dispatch({ type: 'SYNC_GAME_DATA', game, currentUserUid });
        }
    }, [game, currentUserUid]);

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
        if (state.winner) return;
        if (!isMyTurn()) {
            setTurnError('NÃO É A SUA VEZ');
            setTimeout(() => setTurnError(null), 2000);
            return;
        }

        const currentPlayer = state.players[state.currentPlayerIndex];
        let selectedCard = state.selectedCardIndex !== -1 ? currentPlayer.hand[state.selectedCardIndex] : null;

        // Auto-select card logic
        if (!selectedCard) {
            const boardCard = state.board[row][col].card;
            // Find card in hand matching board card
            // Exclude Jacks from auto-select (User Req: "Essa interação não pode acontecer com os VALETES")
            const cardIndex = currentPlayer.hand.findIndex(c => c === boardCard);
            if (cardIndex !== -1 && !boardCard.startsWith('J')) {
                selectedCard = currentPlayer.hand[cardIndex];
                // We don't need to dispatch SELECT_CARD, we just use it directly for the move
            } else {
                return; // Nothing to do if no card selected and no auto-match
            }
        }

        const move = isValidMove(selectedCard!, row, col, state.board, currentPlayer.team);

        if (move.isValid && game && currentUserUid) {
            try {
                const { makeMove } = await import('../services/game');

                if (move.type === 'place') {
                    const nextBoard = state.board.map(r => r.map(c => ({ ...c })));
                    nextBoard[row][col].owner = currentPlayer.team;
                    const winResult = checkWin(nextBoard, { row, col }, currentPlayer.team);

                    const teamNumberMap: Record<Team, number> = { 'red': 1, 'blue': 2, 'green': 3 };

                    await makeMove(
                        game.roomId,
                        currentUserUid,
                        row,
                        col,
                        currentPlayer.team,
                        selectedCard,
                        'place',
                        winResult.isWin ? teamNumberMap[currentPlayer.team] : undefined
                    );

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

                dispatch({ type: 'SELECT_CARD', index: -1 });

            } catch (err) {
                console.error('Failed to make move:', err);
            }
        }
    }, [state.winner, state.selectedCardIndex, state.players, state.board, state.currentPlayerIndex, isMyTurn, game, currentUserUid, dispatch]);

    const resetGame = useCallback(async () => {
        if (game?.roomId) {
            try {
                const { startGame } = await import('../services/game');
                await startGame(game.roomId);
            } catch (err) {
                console.error('Failed to restart game:', err);
            }
        }
    }, [game?.roomId]);

    const setupWinScenario = useCallback(() => {
        dispatch({ type: 'SETUP_WIN_SCENARIO' });
    }, []);

    const localPlayer = state.players.find(p => p.uid === currentUserUid);

    return {
        state,
        handleCardClick,
        handleBoardClick,
        resetGame,
        setupWinScenario,
        turnError,
        isMyTurn: isMyTurn(),
        localPlayer: localPlayer
    };
}
