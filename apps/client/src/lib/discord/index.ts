import { DiscordSDK } from '@discord/embedded-app-sdk';
import { create } from 'zustand';
import { Auth, authenticate } from './auth';

if (!import.meta.env.VITE_DISCORD_CLIENT_ID) {
  throw new Error('[AdventureBoard] VITE_DISCORD_CLIENT_ID is not set');
}

type DiscordStore = {
  discordSdk: DiscordSDK | null;
  setDiscordSdk: (discordSdk: DiscordSDK | null) => void;

  auth: Auth | null;
  setAuth: (auth: Auth | null) => void;
};

const useDiscordStore = create<DiscordStore>((set) => ({
  discordSdk: null,
  setDiscordSdk: (discordSdk: DiscordSDK | null) => set({ discordSdk }),

  auth: null,
  setAuth: (auth: Auth | null) => set({ auth }),
}));

async function setupDiscordSDK() {
  try {
    const discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
    useDiscordStore.getState().setDiscordSdk(discordSdk);

    await discordSdk.ready();
    await discordSdk.commands.encourageHardwareAcceleration();

    const auth = await authenticate();
    useDiscordStore.getState().setAuth(auth);

    return true;
  } catch (error) {
    console.error('Error setting up Discord SDK:', error);
    return false;
  }
}

export { useDiscordStore, setupDiscordSDK };
