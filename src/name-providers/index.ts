import { GuildNameProviders } from "./guild";
import type { ProvidedGuild, ProvidedPlayer } from "./provider";

const TIMEOUT = 1000

export const getGuildList = async (): Promise<ProvidedGuild[]> => {
    const guildNames = new Set<string>();
    const guilds: ProvidedGuild[] = [];

    for (let i = 0; i < GuildNameProviders.length; i++) {
        const provider = GuildNameProviders[i];
        const data = await provider.fetchNameList();
        data.forEach(guild => {
            if(!guildNames.has(guild.name)) {
                guildNames.add(guild.name)
                guilds.push(guild)
            }
        });
        if (i < GuildNameProviders.length - 1) {
            await Bun.sleep(TIMEOUT);
        }
    }

    return guilds
}

export const getAllPlayers = async (): Promise<ProvidedPlayer[]> => {
    const {PlayerNameProviders} = await import('./player')
    const uuids = new Set<string>();
    const players: ProvidedPlayer[] = [];

    for (let i = 0; i < PlayerNameProviders.length; i++) {
        const provider = PlayerNameProviders[i];
        const data = await provider.fetchNameList();
        data.forEach(player => {
            if(!uuids.has(player.uuid)) {
                uuids.add(player.uuid)
                players.push(player)
            }
        });
        if (i < PlayerNameProviders.length - 1) {
            await Bun.sleep(TIMEOUT);
        }
    }

    return players
}
