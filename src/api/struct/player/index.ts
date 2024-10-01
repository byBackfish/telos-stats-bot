export interface PlayerProfile {
	username: string;
	online: boolean;
	server: string;
	activeCharacter: string | null;
	uuid: string;
	rank: string;
	rankBadge: string; // URL to the badge SVG in the Wynncraft CDN (only path)
	legacyRankColour: {
		main: string;
		sub: string;
	};
	shortenedRank: string;
	supportRank: string;
	veteran: boolean;
	firstJoin: string;
	lastJoin: string;
	playtime: number;
	guild: {
		name: string;
		prefix: string;
		rank: string;
		rankStars: string;
	};
	globalData: {
		wars: number;
		totalLevels: number;
		killedMobs: number;
		chestsFound: number;
		dungeons: {
			total: number;
			list: {
				[dungeonName: string]: number; // Number of total completions on all characters
			};
		};
		raids: {
			total: number;
			list: {
				[raidName: string]: number; // Number of total completions on all characters
			};
		};
		completedQuests: number;
		pvp: {
			kills: number;
			deaths: number;
		};
	};
	forumLink: number | null;
	ranking: {
		[rankingType: string]: number;
	};
	previousRanking: {
		[rankingType: string]: number;
	};
	publicProfile: boolean;
	characters: {
		[characterUuid: string]: {
			type: string;
			nickname: string;
			level: number;
			xp: number;
			xpPercent: number;
			totalLevel: number;
			wars: number;
			playtime: number;
			mobsKilled: number;
			chestsFound: number;
			blocksWalked: number;
			itemsIdentified: number;
			logins: number;
			deaths: number;
			discoveries: number;
			pvp: {
				kills: number;
				deaths: number;
			};
			gamemode: string[]; // e.g., ["hunted", "hardcore"]
			skillPoints: {
				strength: number;
				dexterity: number;
				intelligence: number;
				defence: number;
				agility: number;
			};
			professions: {
				fishing: {
					level: number;
					xpPercent: number;
				};
				mining: {
					level: number;
					xpPercent: number;
				};
				// Add other professions as needed
			};
			dungeons: {
				total: number;
				list: {
					[dungeonName: string]: number;
				};
			};
			raids: {
				total: number;
				list: {
					[raidName: string]: number;
				};
			};
			quests: string[]; // List of quest names
		};
	};
}
