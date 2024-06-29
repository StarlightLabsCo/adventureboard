import { create } from 'zustand';
import { Connections, Connection, Presence } from 'adventureboard-ws-types';
import { connect } from './connection';

export type WebSocketStore = {
  ws: WebSocket | null;
  connect: (accessToken: string, instanceId: string) => void;
  exponentialBackoff: number;

  connectionId: string | null;
  connections: Connections;
  myPresence: Presence | undefined;
  useSelf: () => Connection | undefined;
  useMyPresence: () => [Presence | undefined, (presence: Presence) => void];

  useOthers: () => Connection[];
  useOthersConnectionIds: () => string[];
  useOther: (connectionId: string) => Connection | undefined;
};

export type WebSocketStoreSet = (partial: Partial<WebSocketStore>) => void;

export const useWebsocketStore = create<WebSocketStore>((set, get) => ({
  ws: null,
  connect: (accessToken: string, instanceId: string) => connect(set, get, accessToken, instanceId),
  exponentialBackoff: 250,

  connectionId: null,
  connections: {},
  myPresence: undefined,

  // Selectors
  useSelf: () => {
    const connectionId = get().connectionId;
    return connectionId ? get().connections[connectionId] : undefined;
  },

  useMyPresence: () => {
    const connectionId = get().connectionId;
    if (!connectionId) return [undefined, () => {}];

    return [
      get().connections[connectionId]?.presence,
      (presence: Presence) => {
        set((state) => {
          state.connections[connectionId].presence = presence;
          return { connections: state.connections };
        });

        const ws = get().ws;
        if (ws) {
          ws.send(JSON.stringify({ type: 'presence', presence }));
        }
      },
    ];
  },

  useOthers: () => {
    const connectionId = get().connectionId;
    return Object.values(get().connections).filter((conn) => conn.connectionId !== connectionId);
  },

  useOthersConnectionIds: () => {
    const connectionId = get().connectionId;
    return Object.keys(get().connections).filter((conn) => conn !== connectionId);
  },

  useOther: (connectionId: string) => {
    const connection = get().connections[connectionId];
    return connection;
  },
}));
