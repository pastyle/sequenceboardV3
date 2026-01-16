# SEQUENCE Board Game - React Migration

A modern implementation of the SEQUENCE board game, built with React, TypeScript, and Tailwind CSS.

## 🚀 Tech Stack
- **Frontend Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Hooks / Context
- **Backend (Planned):** Firebase

## 🛠️ Setup & Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Dev Server:**
   ```bash
   npm run dev
   ```

3. **Build for Production:**
   ```bash
   npm run build
   ```

## 📂 Project Structure
- `src/game`: Core game logic (pure TS) and constants.
- `src/components`: React components (Board, PlayerHand, etc.).
- `src/ui`: UI components (Header, formatting).
- `src/types`: TypeScript interfaces.
- `src/hooks`: Custom hooks (useGameState).
- `legacy/`: Original Vanilla JS implementation.

## 🎮 Game Rules
- **Objective:** Form rows of 5 markers (Sequences).
- **Cards:**
  - **Two-Eyed Jacks:** Wild! Place anywhere.
  - **One-Eyed Jacks:** Remove an opponent's marker.
  - **Dead Cards:** If you hold a card with no open spaces, trade it for a fresh card.
- **Winning:** 2 Sequences (Teams of 2) or 1 Sequence (3 Players - *not yet implemented*).
