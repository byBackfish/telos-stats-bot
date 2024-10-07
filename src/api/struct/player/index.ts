export interface PlayerContainer {
	data: PlayerProfile;
}

export interface PlayerProfile {
	uniqueId: string;
	username: string;
	currentServer: string;
	lastPlayed: number;
	rank: string;
	balance: number;
	boost: {
		fame: number;
		loot: number;
	};
	guild: {
		guild: string;
		invites: Record<
			string,
			{
				guild: string;
				player: string;
			}
		>;
	};
	sticker: string;
	companions: {
		selected: {
			pet: string;
			mount: string;
		};
		unlocked: string[];
	};
	quests: {
		progress: Record<
			string,
			{
				limit: number;
				value: number;
			}
		>;
		// TODO: Add `questLines`
	};
	// TODO: Check how rewards look
	rewards: unknown[];
	characters: {
		selected: string;
		slots: number;
		all: Character[];
	};
	glow: string;
	visibility: {
		pets: boolean;
		mounts: boolean;
		others: boolean;
		stickers: boolean;
		hidden: boolean;
	};
	stash: {
		size: number;
		contents: Item[][];
	};
	statistics: Record<string, number>;
	playTime: string;
}

export interface Character {
	uniqueId: string;
	created: number;
	lastPlayed: number;
	playTime: string;
	type: string;
	ruleset: {
		type: string;
	};
	stats: {
		values: Record<string, number>;
		restorable: Record<string, number>;
	};
	fame: number;
	highestFame: number;
	level: number;
	itemFilter: {
		components: ItemFilterComponent[];
	};
	runes: string[];
	inventory: {
		armor: Item[];
		extra: Item[];
		storage: Item[];
		selectedSlot: number;
	};
	previousLife: unknown;
	backpack: {
		contents: Item[];
	};
	potions: number;
	statistics: Record<string, number>;
	// TODO: Check how `store` looks
	store: unknown;
}

type ItemFilterComponent =
	| {
			type: "tier";
			cutoff: number;
	  }
	| {
			type: "class";
			whitelist: string[];
	  }
	| { type: "potion"; allowNormal: boolean; allowGreater: boolean };

type Item =
	| {
			type: "xyz.rotmc.rapture.serialization.item.Item";
			identifier: string;
			id: string;
			owner: string;
			// TODO: Check how exactly `features` look
			features: {
				type: string;
			}[];
	  }
	| {
			type: "empty";
	  };
