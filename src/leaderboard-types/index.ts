import { getPlayerProfile } from "../api";
import type { GuildProfile } from "../api/struct/guild";
import type { PlayerProfile } from "../api/struct/player";
import type { ObjectPath } from "../discord/util/typeUtils";
export type LeaderboardType =
	| {
			name: string;
			category: "player";
			type: "calculated";
			getValue: (profile: PlayerProfile) => number;
	  }
	| {
			name: string;
			category: "player";
			type: "path";
			path: ObjectPath<PlayerProfile>;
	  }
	| {
			name: string;
			category: "guild";
			getValue: (profile: GuildProfile<"username" | "uuid">) => number;
	  };

const createPlayerStat = (
	name: string,
	getValue: ObjectPath<PlayerProfile> | ((profile: PlayerProfile) => number),
): LeaderboardType => {
	if (typeof getValue === "string") {
		return {
			name,
			category: "player",
			type: "path",
			path: getValue,
		};
	}
	return {
		name,
		category: "player",
		type: "calculated",
		getValue,
	};
};

type NestedObject = Record<string, unknown>;

const isNumberPath = <T extends NestedObject>(
	data: T,
	path: string,
): boolean => {
	const keys = path.split(".");
	let current: NestedObject | undefined = data;

	for (const key of keys) {
		if (current && typeof current === "object" && key in current) {
			current = current[key] as NestedObject; // Cast to NestedObject
		} else {
			return false;
		}
	}

	return typeof current === "number";
};

const IGNORED_PROPERTIES = [
	"characters",
	"previousRanking",
	"__proto__",
	"constructor",
	"prototype",
];
const isIgnoredProperty = (key: string): boolean => {
	return IGNORED_PROPERTIES.includes(key);
};

const isObject = (value: unknown): value is NestedObject => {
	return typeof value === "object" && value !== null;
};

const generateAllProviders = async (
	name: string,
): Promise<LeaderboardType[]> => {
	const playerProfile = await getPlayerProfile(name);

	const allFields = <T extends NestedObject>(
		data: T,
		parentKey = "",
	): string[] => {
		return Object.keys(data).flatMap((key) => {
			if (isIgnoredProperty(key)) {
				return [];
			}

			const fullKey = parentKey ? `${parentKey}.${key}` : key;
			const value = data[key];

			if (isObject(value)) {
				return allFields(value as NestedObject, fullKey);
			}
			return fullKey;
		});
	};

	const allPaths = allFields(playerProfile as unknown as NestedObject);

	const providers: LeaderboardType[] = allPaths
		.filter((path) =>
			isNumberPath(playerProfile as unknown as NestedObject, path),
		)
		.map((path) =>
			createPlayerStat(path, path as unknown as ObjectPath<PlayerProfile>),
		);

	return providers;
};

export const getLeaderboardTypes = async () =>
	await generateAllProviders("byBackfish");
