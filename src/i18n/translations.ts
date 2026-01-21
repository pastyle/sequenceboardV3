import type { Translation } from './types';

export const translations: Record<string, Translation> = {
    'pt-BR': {
        // Game Header
        game_waitingForOpponent: 'Aguardando Oponente...',
        game_opponentTurn: 'Vez do Oponente',
        game_yourTurn: 'Sua Vez',
        game_gameWon: 'Você Venceu!',
        game_gameLost: 'Você Perdeu!',
        game_draw: 'Empate!',
        game_reset: 'Reiniciar Jogo',
        game_copyLink: 'Copiar Link',
        game_copied: 'Copiado!',
        game_online: 'Online',
        game_offline: 'Offline',

        // Actions
        action_discard: 'Descartar & Comprar',
        action_confirmDiscard: 'Confirmar Descarte',
        action_cancel: 'Cancelar',

        // Lobby
        lobby_createGame: 'Criar Novo Jogo',
        lobby_joinGame: 'Entrar com Código',
        lobby_enterName: 'Seu Nome',
        lobby_enterCode: 'Código da Sala',
        lobby_join: 'Entrar',
        lobby_joining: 'Entrando...',
        lobby_or: 'OU',
        lobby_reconnect: 'Reconectar ao Jogo',
        lobby_previousGame: 'Jogo Anterior Encontrado',
        lobby_roomCodePlaceholder: 'Ex: ABCD',

        // Waiting Room
        waiting_title: 'Sala de Espera',
        waiting_roomCode: 'Código da Sala:',
        waiting_copy: 'Copiar',
        waiting_players: 'Jogadores',
        waiting_waitingForPlayers: 'Aguardando jogadores...',
        waiting_ready: 'Pronto',
        waiting_notReady: 'Não Pronto',
        waiting_start: 'Iniciar Jogo',
        waiting_leave: 'Sair da Sala',
        waiting_host: 'Host',
        waiting_you: 'Você',
        waiting_minPlayers: 'Mínimo de 3 jogadores para iniciar (modo time) ou jogue 1v1',

        // New Lobby
        lobby_maxCapacity: 'Capacidade Máxima',
        lobby_passwordRequired: 'Senha Necessária',
        lobby_enterPasswordFor: 'Senha da sala...',
        lobby_playersCount: 'Jogadores:',
        lobby_waitingForOpponents: 'Aguardando outros jogadores...',
        lobby_leaveRoom: 'Sair da Sala',
        lobby_startGame: 'Iniciar Partida',

        // Game
        game_loading: 'Carregando...',
        game_exitToLobby: 'Sair para o Lobby',
    },
    'en-US': {
        // Game Header
        game_waitingForOpponent: 'Waiting for Opponent...',
        game_opponentTurn: "Opponent's Turn",
        game_yourTurn: 'Your Turn',
        game_gameWon: 'You Won!',
        game_gameLost: 'You Lost!',
        game_draw: 'Draw!',
        game_reset: 'Reset Game',
        game_copyLink: 'Copy Link',
        game_copied: 'Copied!',
        game_online: 'Online',
        game_offline: 'Offline',

        // Actions
        action_discard: 'Discard & Draw',
        action_confirmDiscard: 'Confirm Discard',
        action_cancel: 'Cancel',

        // Lobby
        lobby_createGame: 'Create New Game',
        lobby_joinGame: 'Join with Code',
        lobby_enterName: 'Your Name',
        lobby_enterCode: 'Room Code',
        lobby_join: 'Join',
        lobby_joining: 'Joining...',
        lobby_or: 'OR',
        lobby_reconnect: 'Reconnect to Game',
        lobby_previousGame: 'Previous Game Found',
        lobby_roomCodePlaceholder: 'Ex: ABCD',

        // Waiting Room
        waiting_title: 'Waiting Room',
        waiting_roomCode: 'Room Code:',
        waiting_copy: 'Copy',
        waiting_players: 'Players',
        waiting_waitingForPlayers: 'Waiting for players...',
        waiting_ready: 'Ready',
        waiting_notReady: 'Not Ready',
        waiting_start: 'Start Game',
        waiting_leave: 'Leave Room',
        waiting_host: 'Host',
        waiting_you: 'You',
        waiting_minPlayers: 'Minimum 3 players to start (team mode) or play 1v1',

        // New Lobby
        lobby_maxCapacity: 'Max Capacity',
        lobby_passwordRequired: 'Password Required',
        lobby_enterPasswordFor: 'Room password...',
        lobby_playersCount: 'Players:',
        lobby_waitingForOpponents: 'Waiting for other players...',
        lobby_leaveRoom: 'Leave Room',
        lobby_startGame: 'Start Game',

        // Game
        game_loading: 'Loading...',
        game_exitToLobby: 'Exit to Lobby',
    }
};
