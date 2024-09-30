import { BunClient, BunCommand, type CommandArgument } from '@bybackfish/buncord';
import { AutocompleteInteraction, IntentsBitField } from 'discord.js';
import { join } from 'path';
import type { DataSavingService } from '../service/DataSavingService';
import type { PlayerService } from '../service/PlayerService';
import { getLeaderboardTypes, type LeaderboardType } from '../leaderboard-types';

export class CustomClient extends BunClient<CustomClient> {
    leaderboardTypes: LeaderboardType[] = [];

    constructor(public playerService: PlayerService) {
        super({
            intents: [
                IntentsBitField.Flags.Guilds,
                IntentsBitField.Flags.GuildMembers,
                IntentsBitField.Flags.GuildPresences,
            ],
            commands: {
                commandDirPath: join(__dirname, './commands'),
            },
            listeners: {
                listenerDirPath: join(__dirname, './listener'),
            },
            token: process.env.DISCORD_TOKEN,
        });

        getLeaderboardTypes().then(types => this.leaderboardTypes = types);
    }
}
