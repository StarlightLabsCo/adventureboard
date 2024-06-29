import { create } from 'zustand';

interface GlobalStore {
  isDiscord: boolean;
}

const determineIsDiscord = (): boolean => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.has('frame_id');
};

export const useGlobalStore = create<GlobalStore>(() => ({
  isDiscord: determineIsDiscord(),
}));
