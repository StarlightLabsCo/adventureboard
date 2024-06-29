interface Connections {
  [connectionId: string]: Connection;
}

interface Connection {
  connectionId: string;
  discordUser: { id: string; username: string; global_name: string | null; avatar: string | null; discriminator: string };
  isHost: boolean;
  presence: Presence;
}

interface Presence {
  pageId: string;
  cursor: { x: number; y: number } | null;
  // Add other presence-related fields here
}

type GameSystem = 'd&d5e' | 'pathfinder' | 'daggerheart' | 'other';

interface GameState {
  system: GameSystem | null;
  // currentPageId: string;
}

export type { Connections, Connection, Presence, GameSystem, GameState };
