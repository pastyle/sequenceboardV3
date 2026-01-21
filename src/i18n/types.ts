export type Language = 'en' | 'pt' | 'es';

export interface TranslationDictionary {
    // Lobby
    lobby_createGame: string;
    lobby_joinGame: string;
    lobby_enterName: string;
    lobby_gameId: string;
    lobby_roomCodePlaceholder: string;
    lobby_join: string;
    lobby_joining: string;
    lobby_create: string;
    lobby_hosting: string;
    lobby_players: string;
    lobby_waiting: string;
    lobby_startGame: string;
    lobby_copyLink: string;
    lobby_previousGame: string;
    lobby_reconnect: string;

    // Game Status
    game_waitingFor: string;
    game_yourTurn: string;
    game_won: string;
    game_gameOver: string;
    game_winner: string;
    game_playAgain: string;
    game_loading: string;

    // Player Hand
    hand_yourHand: string;
    hand_discard: string;
    hand_noMoves: string;
    hand_timeRunningOut: string;

    // Board
    board_place: string;
    board_remove: string;

    // General
    you: string;
    team: string;
    host: string;
    copy: string;
}
