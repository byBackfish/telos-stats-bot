import type { GuildNameProvider, ProvidedGuild } from "./provider";

const createProvider = (
	name: string,
	fetchNameList: () => Promise<ProvidedGuild[]>,
): GuildNameProvider => {
	return {
		name,
		fetchNameList,
		type: "guild" as const,
	};
};

const createGuildLeaderboardProviders = (): GuildNameProvider => {
	return createProvider("Guild Leaderboard", async () => {
		const response = await fetch(
			"https://api.wynncraft.com/v3/leaderboards/guildLevel?resultLimit=20",
		);
		const data: Record<string, ProvidedGuild> = await response.json();
		return Object.values(data).map((guild) => ({
			name: guild.name,
			tag: guild.tag,
		}));
	});
};

export const GuildNameProviders: GuildNameProvider[] = [
	createGuildLeaderboardProviders(),
];
