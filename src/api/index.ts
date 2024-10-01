import type { GuildProfile } from "./struct/guild";
import type { PlayerProfile } from "./struct/player";

export type GuildSearchOptions = {
	playerReturnIdentifier: "username" | "uuid";
} & ({ tag: string } | { name: string });

const URLS = {
	playerData: (username: string) =>
		`https://api.wynncraft.com/v3/player/${username}?fullResult`,
	guildData: (guildSearchOptions: GuildSearchOptions) => {
		if ("tag" in guildSearchOptions) {
			return `https://api.wynncraft.com/v3/guild/prefix/${guildSearchOptions.tag}?identifier=${guildSearchOptions.playerReturnIdentifier}`;
		}
		return `https://api.wynncraft.com/v3/guild/${guildSearchOptions.name}?identifier=${guildSearchOptions.playerReturnIdentifier}`;
	},
};

type UrlKey = keyof typeof URLS & {};

export const get = async <T, U extends UrlKey>(
	route: U,
	...input: Parameters<(typeof URLS)[U]>
): Promise<T> => {
	const func = URLS[route];
	// @ts-ignore
	const url = func(...input);
	const response = await fetch(url);
	const json = await response.json();

	return json;
};

export const getPlayerProfile = async (
	username: string,
): Promise<PlayerProfile> => {
	const data: PlayerProfile = await get("playerData", username);
	return data;
};

export const getGuildProfile = async <T extends "uuid" | "username">(
	guildSearchOptions: GuildSearchOptions & { playerReturnIdentifier: T },
): Promise<GuildProfile<T>> => {
	const data: GuildProfile<T> = await get("guildData", guildSearchOptions);
	return data;
};

export type StreamOptions<FunctionArgs, Result> = {
	function: (...args: FunctionArgs[]) => Promise<Result>;
	callback: (data: Result) => void;
	args: FunctionArgs[][];
	timeout: number;
};

export const streamBatch = async <FunctionArgs, Result>(
	options: StreamOptions<FunctionArgs, Result>,
) => {
	const { function: func, callback, args, timeout } = options;
	for (let i = 0; i < args.length; i++) {
		const data = await func(...args[i]);
		callback(data);
		if (i < args.length - 1) {
			await Bun.sleep(timeout);
		}
	}
};
