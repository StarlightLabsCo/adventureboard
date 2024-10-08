import { WebSocketStore, WebSocketStoreSet } from '.';

export async function connect(set: WebSocketStoreSet, get: () => WebSocketStore, instanceId: string) {
  try {
    console.log(`[AdventureBoard WS] Connecting...`);

    // TODO: we're abstracting away the need to put auth token and stuff in
    // TODO: check auth - check if we have discord auth, or check i

    if (!instanceId) {
      console.error('[AdventureBoard WS] No instanceId provided');
      return;
    }

    // TODO: change this to be a patterned url
    const wsUrl = `wss://${location.host}${location.pathname}${location.search}`;
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
      console.log(`[AdventureBoard WS] Connected`);
      set({ ws, exponentialBackoff: 1000 });
    });

    ws.addEventListener('message', (event: MessageEvent) => {
      console.log(`[WS] Message: ${event.data}`);
      const data = JSON.parse(event.data);
      if (data.type === 'connectionId') {
        set({ connectionId: data.connectionId });
      } else if (data.type === 'connections') {
        set({ connections: data.connections });
      }
    });

    ws.addEventListener('error', (error) => {
      console.error('[AdventureBoard WS] Error:', error);
    });

    ws.addEventListener('close', (event: CloseEvent) => {
      console.log(`[AdventureBoard WS] WebSocket connection closed. Code: ${event.code} Reason: ${event.reason}`);

      set({
        ws: null,
      });

      if (!event.wasClean) {
        // TODO: log error to sentry
      }

      retry(set, get, instanceId);
    });
  } catch (error) {
    console.error('[AdventureBoard WS] Error:', error);
    retry(set, get, instanceId);
  }
}

export async function retry(set: WebSocketStoreSet, get: () => WebSocketStore, instanceId: string) {
  setTimeout(() => {
    set({ exponentialBackoff: get().exponentialBackoff * 2 });
    get().connect(instanceId);
  }, get().exponentialBackoff);
}
