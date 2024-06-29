import { APIUser } from 'discord-api-types/v10';

export async function fetchDiscordUser(accessToken: string, discordApiBase: string): Promise<APIUser | null> {
	const userResponse = await fetch(`${discordApiBase}/users/@me`, {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	if (!userResponse.ok) {
		return null;
	}

	return userResponse.json();
}

export function stripPrivateInfo(user: APIUser) {
	return {
		id: user.id,
		username: user.username,
		global_name: user.global_name,
		avatar: user.avatar,
		discriminator: user.discriminator,
	};
}
