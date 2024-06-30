import { Lucia } from 'lucia';
import { D1Adapter } from '@lucia-auth/adapter-sqlite';
import { D1Database } from '@cloudflare/workers-types';
import { Discord } from 'arctic';

// Initial Setup
export function initializeLucia(D1: D1Database) {
  const adapter = new D1Adapter(D1, {
    user: 'user',
    session: 'session',
  });
  return new Lucia(adapter);
}

declare module 'lucia' {
  interface Register {
    Lucia: ReturnType<typeof initializeLucia>;
  }
}

// Providers
export function createDiscordAuth(DISCORD_CLIENT_ID: string, DISCORD_CLIENT_SECRET: string, DISCORD_REDIRECT_URI: string) {
  return new Discord(DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, DISCORD_REDIRECT_URI);
}
