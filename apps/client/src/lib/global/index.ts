import { create } from 'zustand';

interface GlobalStore {
  isDiscord: boolean;
}

function determineIsDiscord(): boolean {
  const isDiscordHostName = location.hostname.endsWith('discordsays.com');
  const hasFrameId = location.search.includes('frame_id');

  const isDiscord = isDiscordHostName && hasFrameId;
  if (isDiscord) {
    console.log('[AdventureBoard] Running in Discord Embedded Activity.');
  } else {
    console.log('[AdventureBoard] Running in standalone browser.');
  }

  return isDiscord;
}

export const useGlobalStore = create<GlobalStore>(() => ({
  isDiscord: determineIsDiscord(),
}));
