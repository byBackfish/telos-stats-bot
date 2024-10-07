import type { PlayerContainer, PlayerProfile } from "./struct/player";

const URLS = {
	playerData: (username: string) =>
		`https://api.telosrealms.com/lookup/player/${username}`,
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
	const data: PlayerContainer = await get("playerData", username);
	return data.data;
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
