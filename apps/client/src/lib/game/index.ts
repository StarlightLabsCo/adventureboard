import { GameState } from 'adventureboard-ws-types';
import { create } from 'zustand';

interface GameStore {
  gameState: GameState;
  setGameState: (gameState: GameState) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: {
    system: null,
    // currentPageId: 'page:page',
  },
  setGameState: (gameState) => set({ gameState }),
}));
