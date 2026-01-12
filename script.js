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

const boardElement = document.getElementById('game-board');
const handElement = document.getElementById('player-hand');
const statusElement = document.getElementById('game-status');

function getSuitClass(cardString) {
    if (cardString === 'Joker') return 'suit-joker';
    if (cardString.includes('♠')) return 'suit-spades';
    if (cardString.includes('♣')) return 'suit-clubs';
    if (cardString.includes('♥')) return 'suit-hearts';
    if (cardString.includes('♦')) return 'suit-diamonds';
    return '';
}

function renderBoard() {
    boardElement.innerHTML = '';

    boardMatrix.forEach((row, rowIndex) => {
        row.forEach((card, colIndex) => {
            const cell = document.createElement('div');
            cell.className = `board-cell ${getSuitClass(card)}`;

            // Special styling for corner Jokers
            if (card === 'Joker') {
                cell.classList.add('joker-cell');
                cell.textContent = 'JOKER';
            } else {
                cell.textContent = card;
            }

            cell.dataset.row = rowIndex;
            cell.dataset.col = colIndex;
            cell.dataset.card = card;

            cell.addEventListener('click', handleCellClick);

            boardElement.appendChild(cell);
        });
    });

    console.log('Board rendered');
}

function handleCellClick(event) {
    const cell = event.currentTarget;
    const row = cell.dataset.row;
    const col = cell.dataset.col;
    const card = cell.dataset.card;

    const message = `Clicked: ${card} at [${row}, ${col}]`;
    console.log(message);
    statusElement.textContent = message;

    // Visual feedback
    // Remove previous selection
    document.querySelectorAll('.board-cell').forEach(c => c.style.border = 'none');
    // Add selection
    cell.style.border = '2px solid white';
}

function renderHand() {
    // Mock hand data to demonstrate Jacks
    const hand = [
        { card: 'J♠', type: 'two-eyed' }, // Adds
        { card: 'J♥', type: 'two-eyed' }, // Adds
        { card: 'J♣', type: 'one-eyed' }, // Removes
        { card: 'A♠', type: 'normal' },
        { card: '10♦', type: 'normal' }
    ];

    handElement.innerHTML = '';

    hand.forEach(item => {
        const cardDiv = document.createElement('div');

        if (item.card.includes('J')) {
            cardDiv.className = 'hand-card'; // Base class only
            if (item.type === 'two-eyed') {
                cardDiv.classList.add('jack-add');
                cardDiv.textContent = '+';
            } else if (item.type === 'one-eyed') {
                cardDiv.classList.add('jack-remove');
                cardDiv.textContent = '-';
            }
        } else {
            cardDiv.className = `hand-card ${getSuitClass(item.card)}`;
            cardDiv.textContent = item.card;
        }

        handElement.appendChild(cardDiv);
    });
}

// Initialize
renderBoard();
renderHand();
statusElement.textContent = 'Game Ready. Click a cell to test.';
