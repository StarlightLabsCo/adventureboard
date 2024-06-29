import { useDiscordStore } from '.';

if (!import.meta.env.VITE_DISCORD_CLIENT_ID) {
  throw new Error('[AdventureBoard] VITE_DISCORD_CLIENT_ID is not set');
}

export type Auth = {
  access_token: string;
  user: {
    username: string;
    discriminator: string;
    id: string;
    public_flags: number;
    avatar?: string | null | undefined;
    global_name?: string | null | undefined;
  };
};

export async function authenticate() {
  const discordSdk = useDiscordStore.getState().discordSdk;
  if (!discordSdk) {
    throw new Error('[AdventureBoard] DiscordSDK is not set');
  }

  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_DISCORD_CLIENT_ID!,
    response_type: 'code',
    state: '',
    prompt: 'none',
    // More info on scopes here: https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
    scope: [
      // "applications.builds.upload",
      // "applications.builds.read",
      // "applications.store.update",
      // "applications.entitlements",
      // "bot",
      'identify',
      // "connections",
      // "email",
      // "gdm.join",
      'guilds',
      // "guilds.join",
      // "guilds.members.read",
      // "messages.read",
      // "relationships.read",
      'rpc.activities.write',
      // "rpc.notifications.read",
      // "rpc.voice.write",
      'rpc.voice.read',
      // "webhook.incoming",
    ],
  });

  // TODO: actually implement this backend via a cloudflare worker
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
    }),
  });

  const { access_token } = await response.json();

  const auth = await discordSdk.commands.authenticate({
    access_token,
  });

  if (auth == null) {
    throw new Error('[AdventureBoard] Discord SDK authenticate command failed');
  }

  return auth;
}
