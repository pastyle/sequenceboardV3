// Game Configuration
const SUITS = ['♠', '♣', '♥', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'Q', 'K', 'A'];
const JACK_TWOS = ['♣', '♦']; // Two-eyed Jacks (Add)
const JACK_ONES = ['♠', '♥']; // One-eyed Jacks (Remove)

// Game State
let deck = [];
let players = [
    { id: 1, name: 'Player 1', team: 'red', hand: [] },
    { id: 2, name: 'Player 2', team: 'blue', hand: [] }
];
let currentPlayerIndex = 0;
let selectedCardIndex = -1;
let boardState = Array(10).fill().map(() => Array(10).fill(null)); // null or 'red'/'blue'

const boardMatrix = [
    ['Joker', '2♠', '3♠', '4♠', '5♠', '6♠', '7♠', '8♠', '9♠', 'Joker'],
    ['6♣', '5♣', '4♣', '3♣', '2♣', 'A♥', 'K♥', 'Q♥', '10♥', '10♠'],
    ['7♣', 'A♠', '2♦', '3♦', '4♦', '5♦', '6♦', '7♦', '9♥', 'Q♠'],
    ['8♣', 'K♠', '6♣', '5♣', '4♣', '3♣', '2♣', '8♦', '8♥', 'K♠'],
    ['9♣', 'Q♠', '7♣', '6♥', '5♥', '4♥', 'A♥', '9♦', '7♥', 'A♠'],
    ['10♣', '10♠', '8♣', '7♥', '2♥', '3♥', 'K♥', '10♦', '6♥', '2♦'],
    ['Q♣', '9♠', '9♣', '8♥', '9♥', '10♥', 'Q♥', 'Q♦', '5♥', '3♦'],
    ['K♣', '8♠', '10♣', 'Q♣', 'K♣', 'A♣', 'A♦', 'K♦', '4♥', '4♦'],
    ['A♣', '7♠', '6♠', '5♠', '4♠', '3♠', '2♠', '2♥', '3♥', '5♦'],
    ['Joker', 'A♦', 'K♦', 'Q♦', '10♦', '9♦', '8♦', '7♦', '6♦', 'Joker']
];

// Elements
const boardElement = document.getElementById('game-board');
const handElement = document.getElementById('player-hand');
const statusElement = document.getElementById('game-status');
const playerCards = document.querySelectorAll('.player-card');
const deckCountElement = document.getElementById('deck-count');

// Helper Functions
function updateDeckCount() {
    deckCountElement.textContent = deck.length;
}

function getSuitClass(cardString) {
    if (cardString === 'Joker') return 'suit-joker';
    if (cardString.includes('♠')) return 'suit-spades';
    if (cardString.includes('♣')) return 'suit-clubs';
    if (cardString.includes('♥')) return 'suit-hearts';
    if (cardString.includes('♦')) return 'suit-diamonds';
    return '';
}

// Deck System
function createDeck() {
    let newDeck = [];
    // Two standard decks
    for (let d = 0; d < 2; d++) {
        for (let suit of SUITS) {
            for (let rank of RANKS) {
                newDeck.push(rank + suit);
            }
            // Add Jacks
            newDeck.push('J' + suit);
        }
    }
    return shuffle(newDeck);
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function dealCards() {
    // 2 Players: 7 cards each
    const cardsPerPlayer = 7;
    players.forEach(player => {
        player.hand = [];
        for (let i = 0; i < cardsPerPlayer; i++) {
            if (deck.length > 0) player.hand.push(deck.pop());
        }
    });
}

function classifyCard(cardString) {
    if (!cardString.includes('J')) return { type: 'normal', val: cardString };

    // Check for Jacks
    const suit = cardString.slice(-1);
    if (JACK_TWOS.includes(suit)) return { type: 'two-eyed', val: cardString }; // Add
    if (JACK_ONES.includes(suit)) return { type: 'one-eyed', val: cardString }; // Remove
    return { type: 'normal', val: cardString }; // Fallback
}

// Rendering
function renderBoard() {
    boardElement.innerHTML = '';

    boardMatrix.forEach((row, rowIndex) => {
        row.forEach((card, colIndex) => {
            const cell = document.createElement('div');
            cell.className = `board-cell ${getSuitClass(card)}`;

            if (card === 'Joker') {
                cell.classList.add('joker-cell');
                cell.textContent = 'JOKER';
            } else {
                cell.textContent = card;
            }

            // Add Marker if exists
            const cellOwner = boardState[rowIndex][colIndex];
            if (cellOwner) {
                const marker = document.createElement('div');
                marker.className = `marker marker-${cellOwner === 'red' ? 'p1' : 'p2'}`;
                cell.appendChild(marker);
            }

            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.dataset.card = card;

            cell.addEventListener('click', () => handleBoardClick(rowIndex, colIndex, card));

            boardElement.appendChild(cell);
        });
    });
}

function renderHand() {
    handElement.innerHTML = '';
    const currentPlayer = players[currentPlayerIndex];

    currentPlayer.hand.forEach((cardString, index) => {
        const cardInfo = classifyCard(cardString);
        const cardDiv = document.createElement('div');

        if (cardInfo.type !== 'normal') {
            cardDiv.className = 'hand-card';
            if (cardInfo.type === 'two-eyed') {
                cardDiv.classList.add('jack-add');
                cardDiv.textContent = '+';
            } else {
                cardDiv.classList.add('jack-remove');
                cardDiv.textContent = '-';
            }
        } else {
            cardDiv.className = `hand-card ${getSuitClass(cardString)}`;
            cardDiv.textContent = cardString;
        }

        if (index === selectedCardIndex) cardDiv.classList.add('selected');

        cardDiv.addEventListener('click', () => selectCard(index));
        handElement.appendChild(cardDiv);
    });

    // Update Player UI Highlight
    playerCards.forEach((card, idx) => {
        if (idx === currentPlayerIndex) {
            card.classList.add('active');
            card.style.opacity = '1';
        } else {
            card.classList.remove('active');
            card.style.opacity = '0.5';
        }
    });

    statusElement.textContent = `${currentPlayer.name}'s Turn`;
}

// Interaction Logic
function selectCard(index) {
    if (selectedCardIndex === index) {
        selectedCardIndex = -1; // Deselect
        clearHighlights();
    } else {
        selectedCardIndex = index;
        highlightValidMoves(index);
    }
    renderHand();
}

function highlightValidMoves(cardIndex) {
    clearHighlights();
    const cardString = players[currentPlayerIndex].hand[cardIndex];
    const cardInfo = classifyCard(cardString);
    const cells = document.querySelectorAll('.board-cell');

    cells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        const cellCard = cell.dataset.card;
        const isOccupied = boardState[row][col] !== null;
        const isJoker = cellCard === 'Joker';

        if (cardInfo.type === 'one-eyed') {
            // Remove opponent marker
            const opponentTeam = players[currentPlayerIndex].team === 'red' ? 'blue' : 'red';
            if (isOccupied && boardState[row][col] === opponentTeam) {
                // One-eyed jacks can remove from any cell including corner Jokers
                cell.classList.add('highlight-remove');
            }
        } else {
            // Placement Logic (Normal or Two-Eyed)
            // Allow if:
            // 1. Normal card matches cell value AND cell is empty
            // 2. Two-Eyed Jack (places anywhere empty)
            // 3. SPECIAL: Cell is a Corner Joker AND cell is empty (Any card can place here)

            const isMatchingCard = cardInfo.type === 'normal' && cellCard === cardInfo.val;
            const isTwoEyed = cardInfo.type === 'two-eyed';
            const isCornerWild = isJoker; // User rule: Corner Jokers accept any card

            if (!isOccupied) {
                if (isMatchingCard || isTwoEyed || isCornerWild) {
                    cell.classList.add('highlight-target');
                }
            }
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.board-cell').forEach(cell => {
        cell.classList.remove('highlight-target', 'highlight-remove');
    });
}

function handleBoardClick(row, col, cellCard) {
    if (selectedCardIndex === -1) return;

    const cell = document.querySelector(`.board-cell[data-row='${row}'][data-col='${col}']`);
    const isTarget = cell.classList.contains('highlight-target');
    const isRemove = cell.classList.contains('highlight-remove');

    if (isTarget) {
        placeMarker(row, col);
    } else if (isRemove) {
        removeMarker(row, col);
    }
}

function placeMarker(row, col) {
    const player = players[currentPlayerIndex];
    boardState[row][col] = player.team;

    renderBoard(); // Render immediately to show the new marker before checking win

    if (checkSequence(row, col, player.team)) {
        // Game Over handled in checkSequence
        statusElement.textContent = `GAME OVER! ${player.name} Wins!`;
        statusElement.style.color = '#FFD700';
    } else {
        finishTurn();
    }
}

function removeMarker(row, col) {
    // Only allow removing if NOT part of a locked sequence (TODO: Implement locking, currently assumed free unless won)
    // For now, simple removal
    boardState[row][col] = null;
    finishTurn();
}

// Win Logic
function checkSequence(row, col, team) {
    const directions = [
        [0, 1],  // Horizontal
        [1, 0],  // Vertical
        [1, 1],  // Diagonal \
        [1, -1]  // Diagonal /
    ];

    for (let [dr, dc] of directions) {
        let count = 1; // Start with placed piece
        let sequenceCells = [{ r: row, c: col }];

        // Check Forward
        for (let i = 1; i < 5; i++) {
            const r = row + (dr * i);
            const c = col + (dc * i);
            if (isValidCell(r, c) && isTeamOrCorner(r, c, team)) {
                count++;
                sequenceCells.push({ r, c });
            } else {
                break;
            }
        }

        // Check Backward
        for (let i = 1; i < 5; i++) {
            const r = row - (dr * i);
            const c = col - (dc * i);
            if (isValidCell(r, c) && isTeamOrCorner(r, c, team)) {
                count++;
                sequenceCells.push({ r, c });
            } else {
                break;
            }
        }

        if (count >= 5) {
            highlightWin(sequenceCells);
            return true;
        }
    }
    return false;
}

function isValidCell(r, c) {
    return r >= 0 && r < 10 && c >= 0 && c < 10;
}

function isTeamOrCorner(r, c, team) {
    const isCorner = (r === 0 && c === 0) || (r === 0 && c === 9) || (r === 9 && c === 0) || (r === 9 && c === 9);
    return boardState[r][c] === team || isCorner;
}

function highlightWin(cells) {
    cells.forEach(pos => {
        // If it's a marker, highlight it
        const cell = document.querySelector(`.board-cell[data-row='${pos.r}'][data-col='${pos.c}']`);
        const marker = cell.querySelector('.marker');
        if (marker) {
            marker.classList.add('sequence-complete');
        } else if (cell.classList.contains('joker-cell')) {
            // Highlight joker itself if part of sequence
            cell.style.boxShadow = 'inset 0 0 15px #FFD700';
        }
    });
    // Disable further clicks
    boardElement.style.pointerEvents = 'none';
}

function finishTurn() {
    const player = players[currentPlayerIndex];

    // Remove used card
    player.hand.splice(selectedCardIndex, 1);

    // Draw new card
    if (deck.length > 0) {
        player.hand.push(deck.pop());
        updateDeckCount();
    }

    // Reset state
    selectedCardIndex = -1;
    clearHighlights();

    // Switch turn
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;

    // Render
    renderBoard();
    renderHand();
}

// Init
function initGame() {
    deck = createDeck();
    dealCards();
    updateDeckCount();
    renderBoard();
    renderHand();
}

initGame();
