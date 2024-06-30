import type { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';

interface Env {
  DISCORD_API_BASE: string;
  DISCORD_CLIENT_ID: string;
  DISCORD_CLIENT_SECRET: string;
}

// This is being called as part of the Embedded Activity Auth Flow (not traditional browser oauth)
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request } = context;
  const { code } = (await request.json()) as { code: string };

  if (!code) {
    return new Response('Code is required', { status: 400 });
  }

  const response = await fetch(`${context.env.DISCORD_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: context.env.DISCORD_CLIENT_ID,
      client_secret: context.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!response.ok) {
    console.error(await response.text());
    return new Response('Failed to exchange code for access token', { status: 400 });
  }

  const { access_token } = (await response.json()) as RESTPostOAuth2AccessTokenResult;

  return new Response(JSON.stringify({ access_token }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
