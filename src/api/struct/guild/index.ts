export type DefaultMember = {
	online: boolean;
	server: string | null;
	contributed: number;
	joined: string;
};

export type Member<T extends "uuid" | "username"> = T extends "uuid"
	? DefaultMember & { username: string }
	: DefaultMember & { uuid: string };

export interface GuildProfile<T extends "uuid" | "username"> {
	uuid: string;
	name: string;
	prefix: string;
	level: number;
	xpPercent: number;
	territories: number;
	wars: number;
	created: string;
	members: {
		total: number;
		owner: {
			[usernameOrUuid: string]: Member<T>;
		};
		chief: {
			[usernameOrUuid: string]: Member<T>;
		};
		strategist: {
			[usernameOrUuid: string]: Member<T>;
		};
		captain: {
			[usernameOrUuid: string]: Member<T>;
		};
		recruiter: {
			[usernameOrUuid: string]: Member<T>;
		};
		recruit: {
			[usernameOrUuid: string]: Member<T>;
		};
	};
	online: number;
	banner: {
		base: string;
		tier: number;
		structure: string;
		layers: Array<{
			colour: string;
			pattern: string;
		}>;
	};
	seasonRanks: {
		[season: string]: {
			rating: number;
			finalTerritories: number;
		};
	};
}
