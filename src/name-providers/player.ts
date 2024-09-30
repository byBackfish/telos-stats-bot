import { getGuildList } from ".";
import { getGuildProfile } from "../api";
import type { GuildProfile, Member } from "../api/struct/guild";
import type { PlayerNameProvider, ProvidedPlayer } from "./provider";

const RAID_LIMIT = 100;

const createProvider = (name: string, fetchNameList: () => Promise<ProvidedPlayer[]>): PlayerNameProvider => {
    return {
        name,
        fetchNameList,
        type: 'player' as const,
    }
}

const createRaidProvider = (raidName: string, raidId: string): PlayerNameProvider => {
    return createProvider(`Raid Leaderboard - ${raidName}`, async () => {
        const url = `https://api.wynncraft.com/v3/leaderboards/${raidId}?resultLimit=${RAID_LIMIT}`;
        const data = await fetch(url);
        const json = await data.json();
        return Object.values(json).map((entry: any) => ({uuid: entry.uuid, username: entry.name} satisfies ProvidedPlayer));
    });
}

const createGuildProvider = (guildName: string): PlayerNameProvider => {
    return createProvider(`Guild - ${guildName}`, async () => {
        const dataByUUID = await getGuildProfile({name: guildName, playerReturnIdentifier: "uuid"});

        const getAllMembers = (data: GuildProfile<"uuid">): (Member<"uuid"> & { uuid: string;})[] => {
            const members = [data.members.recruit, data.members.recruiter, data.members.captain, data.members.strategist, data.members.chief, data.members.owner].map(rows => {
                return Object.keys(rows).map(uuid => ({uuid, ...rows[uuid]}));
            }).flat();

            return members
        }

        const members = getAllMembers(dataByUUID).map(member => {
            return {uuid: member.uuid, username: member.username}
        })

        return members;
    });
}

const createGuildProviders = async (): Promise<PlayerNameProvider[]> => {
    const guildList = await getGuildList();
    return guildList.map(guild => createGuildProvider(guild.name));
}

export const PlayerNameProviders: PlayerNameProvider[] = [
    createRaidProvider("TCC", "tccCompletion"),
    ...await createGuildProviders()
]
