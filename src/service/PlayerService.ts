import { getAllPlayers, getGuildList } from "../name-providers";
import type { ProvidedGuild, ProvidedPlayer } from "../name-providers/provider";

export class PlayerService {
    private guilds: ProvidedGuild[] = [];
    private players: ProvidedPlayer[] = [];

    constructor(private options: PlayerServiceOptions) {}
    async loadPlayers() {
        const file = Bun.file('cache/players.json')

        const lastSavedUuids: {
            time: number;
            players: ProvidedPlayer[];
        } = await file.exists() ? await file.json() : { time: 0, players: [] };

        if ((lastSavedUuids && Date.now() - lastSavedUuids.time < this.options.cacheTimeout) || !this.options.shouldRefreshCache) {
            console.log('Using cached players');
            this.players = lastSavedUuids.players;
        } else {
        console.log('Refreshing players');
        this.players = await getAllPlayers()
        console.log(`Loaded ${this.players.length} players`);
        await Bun.write('cache/players.json', JSON.stringify({
            time: Date.now(),
            players: this.players
        }))
    }

        const untilNextRefresh = this.options.cacheTimeout - (Date.now() - lastSavedUuids.time);
        if(untilNextRefresh > 0) {
            console.log(`Next refresh in ${untilNextRefresh / 1000 / 60} minutes`);
                setTimeout(() => {
                    this.loadPlayers();
                }, untilNextRefresh);
            }
    }

    async loadGuilds() {
        const file = Bun.file('cache/guilds.json')

        const lastSavedUuids: {
            time: number;
            guilds: ProvidedGuild[];
        } = await file.exists() ? await file.json() : { time: 0, guilds: [] };

        if ((lastSavedUuids && Date.now() - lastSavedUuids.time < this.options.cacheTimeout) || !this.options.shouldRefreshCache) {
            console.log('Using cached guilds');
            this.guilds = lastSavedUuids.guilds;
        } else {
        console.log('Refreshing guilds');
        this.guilds = await getGuildList()
        console.log(`Loaded ${this.guilds.length} guilds`);
        await Bun.write('cache/guilds.json', JSON.stringify({
            time: Date.now(),
            guilds: this.guilds
        }))
    }

        const untilNextRefresh = this.options.cacheTimeout - (Date.now() - lastSavedUuids.time);
        if(untilNextRefresh > 0) {
            console.log(`Next refresh in ${untilNextRefresh / 1000 / 60} minutes`);
                setTimeout(() => {
                    this.loadGuilds();
                }, untilNextRefresh);
            }
    }

    getPlayers() {
        return this.players;
    }

    getGuilds() {
        return this.guilds;
    }
}

type PlayerServiceOptions = {
    cacheTimeout: number;
    shouldRefreshCache: boolean;
}
