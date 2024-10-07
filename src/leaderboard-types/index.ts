import { getPlayerProfile } from "../api";
import type { PlayerProfile } from "../api/struct/player";
import type { ObjectPath } from "../discord/util/typeUtils";
export type LeaderboardType =
	| {
			name: string;
			type: "calculated";
			getValue: (profile: PlayerProfile) => number;
	  }
	| {
			name: string;
			type: "path";
			path: ObjectPath<PlayerProfile>;
	  };

const createPlayerStat = (
	name: string,
	getValue: ObjectPath<PlayerProfile> | ((profile: PlayerProfile) => number),
): LeaderboardType => {
	if (typeof getValue === "string") {
		return {
			name,
			type: "path",
			path: getValue,
		};
	}
	return {
		name,
		type: "calculated",
		getValue,
	};
};

export const LEADERBOARD_TYPES: LeaderboardType[] = [
	{
		name: "Balance",
		type: "calculated",
		getValue: (profile) => profile.balance,
	},
];
