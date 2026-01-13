import { useReducer, useCallback } from 'react';
import type { GameState, BoardState, Team, Player, CellPosition } from '../types/game.types';
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
    | { type: 'SETUP_WIN_SCENARIO' };

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

        default:
            return state;
    }
}

export function useGameState() {
    const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

    const handleCardClick = useCallback((index: number) => {
        if (state.winner) return;
        dispatch({ type: 'SELECT_CARD', index });
    }, [state.winner]);

    const handleBoardClick = useCallback((row: number, col: number) => {
        if (state.winner || state.selectedCardIndex === -1) return;

        const currentPlayer = state.players[state.currentPlayerIndex];
        const selectedCard = currentPlayer.hand[state.selectedCardIndex];

        const move = isValidMove(selectedCard, row, col, state.board, currentPlayer.team);

        if (move.isValid) {
            if (move.type === 'place') {
                dispatch({ type: 'PLACE_MARKER', row, col, team: currentPlayer.team });

                // Check Win AFTER update? logic needs state.board to be updated.
                // Reducer is pure, so we need to simulate the board state for checkWin OR dispatch a check in useEffect?
                // Better: Check win on the *projected* board here, or make reducer handle validation?
                // Reducer should handle state logic.
                // Re-calculating state inside handler:

                const nextBoard = state.board.map(r => r.map(c => ({ ...c })));
                nextBoard[row][col].owner = currentPlayer.team;

                const winResult = checkWin(nextBoard, { row, col }, currentPlayer.team);

                if (winResult.isWin) {
                    dispatch({ type: 'SET_WINNER', team: currentPlayer.team, sequence: winResult.sequence });
                } else {
                    dispatch({ type: 'FINISH_TURN' });
                }

            } else if (move.type === 'remove') {
                dispatch({ type: 'REMOVE_MARKER', row, col });
                dispatch({ type: 'FINISH_TURN' });
            }
        }
    }, [state.winner, state.selectedCardIndex, state.players, state.board, state.currentPlayerIndex]);

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
        setupWinScenario
    };
}
