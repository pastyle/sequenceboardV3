import { useMemo } from 'react';
import { useGameState } from './hooks/useGameState';
import { Board } from './components/Board';
import { PlayerHand } from './components/PlayerHand';
import { GameHeader } from './ui/GameHeader';
import { PlayerList } from './ui/PlayerList';

function App() {
  const { state, handleCardClick, handleBoardClick, resetGame, setupWinScenario } = useGameState();

  const currentPlayer = state.players[state.currentPlayerIndex];

  const statusText = useMemo(() => {
    if (state.winner) {
      const winnerName = state.players.find(p => p.team === state.winner)?.name || state.winner;
      return `GAME OVER! ${winnerName} Wins!`;
    }
    return `${currentPlayer.name}'s Turn`;
  }, [state.winner, state.currentPlayerIndex, currentPlayer, state.players]);

  const selectedCardVal = state.selectedCardIndex !== -1 ? currentPlayer.hand[state.selectedCardIndex] : null;

  return (
    <div className="flex flex-col h-screen w-full bg-bg-dark text-text-primary font-outfit overflow-hidden">
      <GameHeader
        status={statusText}
        winner={state.winner}
        onReset={resetGame}
        onDebugWin={setupWinScenario}
      />

      <main className="flex flex-1 overflow-hidden relative">
        <PlayerList
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          deckCount={state.deck.length}
        />

        <section className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <Board
            board={state.board}
            currentPlayer={currentPlayer}
            selectedCard={selectedCardVal}
            winningCells={state.winningCells}
            onCellClick={handleBoardClick}
          />
        </section>

        <PlayerHand
          hand={currentPlayer.hand}
          selectedCardIndex={state.selectedCardIndex}
          onCardClick={handleCardClick}
        />
      </main>
    </div>
  );
}

export default App;
