import { createLazyFileRoute } from '@tanstack/react-router';

// TODO: this page is the lobby page where you can create new campaign, or view existing campaigns that you're a part of
export const Route = createLazyFileRoute('/lobby')({
  component: () => <div>Hello /lobby!</div>,
});
