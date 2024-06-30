import { createLazyFileRoute } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useWebsocketStore } from '@/lib/websocket';
import { Canvas } from '@/components/Canvas';

export const Route = createLazyFileRoute('/instance')({
  component: Instance,
});

function Instance() {
  const connect = useWebsocketStore((state) => state.connect);
  const ws = useWebsocketStore((state) => state.ws);
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const instanceId = url.searchParams.get('instance_id');
    if (!instanceId) {
      navigate({ to: '/' });
      return;
    }

    connect(instanceId);
  }, [connect, navigate]);

  if (!ws) {
    return null;
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden overscroll-none" draggable="false">
      <Canvas />
    </div>
  );
}
