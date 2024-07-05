import { generateState } from 'arctic';
import { createDiscordAuth } from 'adventureboard-auth';

export async function GET(
  request: Request,
  env: {
    VITE_DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    DISCORD_REDIRECT_URI: string;
    ENVIRONMENT: string;
  },
): Promise<Response> {
  const discord = createDiscordAuth(env.VITE_DISCORD_CLIENT_ID, env.DISCORD_CLIENT_SECRET, env.DISCORD_REDIRECT_URI);
  const state = generateState();
  const url = await discord.createAuthorizationURL(state);

  // TODO: replace with cloudflare functions cookies function
  // cookies().set('discord_oauth_state', state, {
  //   path: '/',
  //   secure: env.ENVIRONMENT === 'production',
  //   httpOnly: true,
  //   maxAge: 60 * 10,
  //   sameSite: 'lax',
  // });

  return Response.redirect(url.toString());
}
