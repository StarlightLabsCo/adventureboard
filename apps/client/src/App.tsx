import { useEffect } from 'react';
import { createId } from '@paralleldrive/cuid2';
import { useGlobalStore } from './lib/global';
import { setupDiscordSDK, useDiscordStore } from './lib/discord';
import { useWebsocketStore } from './lib/websocket';
import { Canvas } from './components/Canvas';

function App() {
  const connect = useWebsocketStore((state) => state.connect);
  const ws = useWebsocketStore((state) => state.ws);

  useEffect(() => {
    const setup = async () => {
      let accessToken: string | null = null;
      let instanceId: string | null = null;

      const isDiscord = useGlobalStore.getState().isDiscord;
      if (isDiscord) {
        console.log('[AdventureBoard] Running in Discord Embedded Activity.');

        const success = await setupDiscordSDK();
        if (!success) {
          throw new Error('[AdventureBoard] DiscordSDK failed to authenticate.');
        }

        accessToken = useDiscordStore.getState().auth!.access_token;
        instanceId = useDiscordStore.getState().discordSdk!.instanceId;
      } else {
        console.log('[AdventureBoard] Running in standalone browser.');
        accessToken = 'test'; // TODO: Idk where I'm gonna get this from

        const urlParams = new URLSearchParams(window.location.search);
        instanceId = urlParams.get('instanceId');
        if (!instanceId) {
          instanceId = createId(); // TODO: this is a bit of a hack, but it's a start
          urlParams.set('instanceId', instanceId);
          window.history.replaceState({}, '', `?${urlParams.toString()}`);
        }
      }

      connect(accessToken, instanceId);
    };

    setup();
  }, [connect]);

  if (!ws) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden overscroll-none" draggable="false">
      <Canvas />
    </div>
  );
}

export default App;
