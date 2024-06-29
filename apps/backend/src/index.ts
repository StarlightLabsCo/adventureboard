import { DurableObject } from 'cloudflare:workers';
import { Connections, Presence, GameState } from 'adventureboard-ws-types';
import { fetchDiscordUser, stripPrivateInfo } from '@/discord';
import { APIUser } from 'discord-api-types/v10';
import { throttle } from 'lodash';

export interface Env {
	GAME_INSTANCES: DurableObjectNamespace<GameInstance>;
	ADVENTUREBOARD_KV: KVNamespace; // KV keys: hostId-campaigns, hostId-selectedCampaignId, hostId-campaignId-snapshot, hostId-campaignId-gameState
	DISCORD_API_BASE: string;
}

export class GameInstance extends DurableObject {
	env: Env;

	private connections: Connections = {};

	private host: string | null = null;
	private campaignId: string | null = null;
	private gameState: GameState = {
		system: null,
	};

	// ------ Init ------
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

		this.env = env;

		this.ctx.blockConcurrencyWhile(async () => {
			await this.init();
		});
	}

	async init() {
		try {
			// TODO: loading connections and loading other info could be in parallel
			await this.loadConnections();

			await this.loadHost();
			if (this.host) {
				await this.loadCampaign();
				await this.loadSnapshot();
				await this.loadGameState();
			}
		} catch (e) {
			console.error(e);
		}
	}

	async loadConnections() {
		const storedConnections = await this.ctx.storage.get<Connections>('connections');
		this.connections = storedConnections || {};
	}

	async loadHost() {
		const storedHost = await this.ctx.storage.get<string | null>('host');
		this.host = storedHost || null;
	}

	async loadCampaign() {
		if (!this.host) return;

		const selectedCampaignId = await this.env.ADVENTUREBOARD_KV.get<string | null>(`${this.host}-selectedCampaignId`);
		if (selectedCampaignId) {
			this.campaignId = selectedCampaignId;
		} else {
			this.campaignId = crypto.randomUUID();
			await this.env.ADVENTUREBOARD_KV.put(`${this.host}-campaigns`, JSON.stringify([this.campaignId]));
			await this.env.ADVENTUREBOARD_KV.put(`${this.host}-selectedCampaignId`, this.campaignId);
		}
	}

	async loadSnapshot() {
		if (!this.host || !this.campaignId) return;

		// TODO: implement
	}

	async loadGameState() {
		if (!this.host || !this.campaignId) return;

		const gameStateKey = `${this.host}-${this.campaignId}-gameState`;
		const gameStateJSON = await this.env.ADVENTUREBOARD_KV.get<string>(gameStateKey);
		if (!gameStateJSON) {
			this.env.ADVENTUREBOARD_KV.put(gameStateKey, JSON.stringify(this.gameState));
		} else {
			this.gameState = JSON.parse(gameStateJSON);
		}
	}

	// ------ New Connection ------
	async fetch(request: Request) {
		// Validation
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected websocket', { status: 426 });
		}

		const isDiscord = request.headers.get('X-Discord-User') !== null;
		if (isDiscord) {
			const discordUser = JSON.parse(request.headers.get('X-Discord-User') || '{}') as APIUser;
			if (!discordUser.id) {
				return new Response('Unauthorized', { status: 401 });
			}

			if (!this.host) {
				this.host = discordUser.id;
				await this.ctx.storage.put('host', this.host);

				await this.loadCampaign();
				await this.loadSnapshot();
				await this.loadGameState();
			}
		} else {
			const user = {
				id: 'harris',
			};

			if (!this.host) {
				this.host = user.id;
				await this.ctx.storage.put('host', this.host);

				await this.loadCampaign();
				await this.loadSnapshot();
				await this.loadGameState();
			}
		}

		// Init WebSocket
		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);

		const connectionId = crypto.randomUUID();
		this.ctx.acceptWebSocket(server, [connectionId]);

		server.send(JSON.stringify({ type: 'connectionId', connectionId }));
		// server.send(
		// 	JSON.stringify({
		// 		type: 'init',
		// 		snapshot: { store: this.records, schema: this.schema.serialize() },
		// 	}),
		// );
		server.send(
			JSON.stringify({
				type: 'gameState',
				gameState: this.gameState,
			}),
		);

		this.addConnection(connectionId, discordUser);

		return new Response(null, { status: 101, webSocket: client });
	}

	// ------ Existing Connection ------
	async webSocketMessage(ws: WebSocket, message: string) {
		const data = JSON.parse(message);
		const connectionId = this.ctx.getTags(ws)[0];

		switch (data.type) {
			case 'presence':
				this.updatePresence(connectionId, data.presence);
				break;
			case 'update':
				this.updateRecords(connectionId, data.updates, ws);
				break;
			case 'recovery':
				this.sendRecovery(ws);
				break;
			case 'gameState':
				this.updateGameState(connectionId, data.gameState);
				break;
			default:
				break;
		}
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string) {
		ws.close(code, reason);

		const tags = this.ctx.getTags(ws);
		const connectionId = tags ? tags[0] : null;

		if (connectionId) {
			this.removeConnection(connectionId);
		}
	}

	// ------ Helpers ------
	async broadcast(message: string, connectionIdsToExclude: string[] = []) {
		const webSockets = this.ctx.getWebSockets();

		webSockets.forEach((ws) => {
			const tags = this.ctx.getTags(ws);
			const connectionId = tags ? tags[0] : null;

			if (connectionId && !connectionIdsToExclude.includes(connectionId)) {
				ws.send(message);
			}
		});
	}

	/* Connections */
	// We only put in storage on add/remove because we don't want to hit the storage on every presence update
	addConnection(connectionId: string, discordUser: APIUser) {
		this.connections[connectionId] = {
			connectionId,
			discordUser: stripPrivateInfo(discordUser),
			presence: { cursor: null, pageId: 'page:page' },
			isHost: this.host === discordUser.id,
		};
		this.broadcast(JSON.stringify({ type: 'connections', connections: this.connections }));
		this.ctx.storage.put('connections', this.connections);
	}

	removeConnection(connectionId: string) {
		delete this.connections[connectionId];
		this.broadcast(JSON.stringify({ type: 'connections', connections: this.connections }));
		this.ctx.storage.put('connections', this.connections);
	}

	/* Presence */
	updatePresence(connectionId: string, presence: Presence) {
		this.connections[connectionId].presence = presence;
		this.broadcast(JSON.stringify({ type: 'presence', connectionId, presence }), [connectionId]);
	}

	/* Records */
	saveSnapshot = throttle(async () => {
		if (!this.host || !this.campaignId) return;

		const snapshotKey = `${this.host}-${this.campaignId}-snapshot`;
		await this.env.ADVENTUREBOARD_KV.put(snapshotKey, JSON.stringify({ store: this.records, schema: this.schema.serialize() }));
	}, 1000);

	// updateRecords(connectionId: string, updates: HistoryEntry<TLRecord>[], ws: WebSocket) {
	// 	try {
	// 		updates.forEach((update) => {
	// 			const { added, updated, removed } = update.changes;
	// 			Object.values(added).forEach((record) => (this.records[record.id] = record));
	// 			Object.values(updated).forEach(([, to]) => (this.records[to.id] = to));
	// 			Object.values(removed).forEach((record) => delete this.records[record.id]);
	// 		});
	// 		this.broadcast(JSON.stringify({ type: 'update', updates }), [connectionId]);
	// 		this.saveSnapshot();
	// 	} catch (e) {
	// 		this.sendRecovery(ws);
	// 	}
	// }

	/* Game State */
	async updateGameState(connectionId: string, gameState: GameState) {
		this.gameState = gameState;
		this.broadcast(JSON.stringify({ type: 'gameState', gameState }), [connectionId]);
		const gameStateKey = `${this.host}-${this.campaignId}-gameState`;
		await this.env.ADVENTUREBOARD_KV.put(gameStateKey, JSON.stringify(gameState));
	}

	/* Recovery */
	sendRecovery(ws: WebSocket) {
		// ws.send(
		// 	JSON.stringify({
		// 		type: 'recovery',
		// 		snapshot: { store: this.records, schema: this.schema.serialize() },
		// 	}),
		// );
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const params = new URLSearchParams(url.search);

		const instanceId = params.get('instanceId');
		if (!instanceId) {
			return new Response('Instance ID is required', { status: 400 });
		}

		if (instanceId) {
			const id = env.GAME_INSTANCES.idFromName(instanceId);
			const stub = env.GAME_INSTANCES.get(id);

			const accessToken = params.get('accessToken');
			if (!accessToken) {
				return new Response('Unauthorized', { status: 401 });
			}

			// TODO: need a way to tell discord user apart from regular user

			const discordUser = await fetchDiscordUser(accessToken, env.DISCORD_API_BASE);
			if (!discordUser) {
				return new Response('Unauthorized', { status: 401 });
			}

			const newRequest = new Request(request, {
				headers: {
					...Object.fromEntries(request.headers),
					'X-Discord-User': JSON.stringify(discordUser),
				},
			});

			return stub.fetch(newRequest);
		}

		return new Response('Not found', { status: 404 });
	},
};
