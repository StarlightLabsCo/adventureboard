import { useEffect } from 'react';
import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useGlobalStore } from '@/lib/global';
import { setupDiscordSDK } from '@/lib/discord';

// TODO: this page will show a very minimal landing page, logo at the top with a sign in button at the bottom for discord oauth
// TODO: if this is opened from discord, the sign in button is replaced with a spinner and loading info
// TODO: after sign in, or discord auth, it redirects to the lobby
// TODO: also this checks if the user is already signed in and if so redirects to the lobby
export const Route = createLazyFileRoute('/')({
  component: Index,
});

function Index() {
  const isDiscord = useGlobalStore((state) => state.isDiscord);
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      if (isDiscord) {
        const success = await setupDiscordSDK();
        if (success) {
          navigate({ to: '/lobby' });
        }
      } else {
        window.location.href = '/auth/login/discord';
      }
    }

    init();
  }, []);

  return <>Loading...</>;
}
