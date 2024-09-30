import { BunCommand, type CommandArgument } from "@bybackfish/buncord";
import type { AutocompleteInteraction } from "discord.js";
import type { CustomClient } from "..";
import type { ProvidedPlayer } from "../../name-providers/provider";


export const playerOption = (valueKey: keyof ProvidedPlayer): CommandArgument => ({
    name: 'player',
    description: "Player's Username",
    required: true,
    autocomplete: true,
    type: BunCommand.Type.STRING,
    onAutocomplete: async (client: CustomClient, interaction: AutocompleteInteraction) => {
        const current = interaction.options.getFocused()
        const players = client.playerService.getPlayers().filter(player => player.username.toLowerCase().includes(current.toLowerCase())).slice(0, 25)
        return players.map(player => ({
            name: player.username,
            value: player[valueKey],
        }));
    }
} as CommandArgument);

export const leaderboardStatOption = (required = true): CommandArgument => ({
    name: 'type',
    description: 'Stat to display on the leaderboard',
    required,
    type: BunCommand.Type.STRING,
    autocomplete: true,
    onAutocomplete: async (client: CustomClient, interaction: AutocompleteInteraction) => {
        const current = interaction.options.getFocused()
        return client.leaderboardTypes.filter(type => type.name.toLowerCase().includes(current.toLowerCase())).slice(0, 25).map(type => ({
            name: type.name,
            value: type.name,
        }));
    }
} as CommandArgument);

export const TIME_OPTIONS = [
    {
        name: 'All Time',
        value: '-1'
    }, {
        name: 'Last Hour',
        value: '1h'
    }, {
        name: 'Last 24 Hours',
        value: '1d'
    }, {
        name: 'Last 7 Days',
        value: '7d'
    }, {
        name: 'Last 30 Days',
        value: '30d'
    }, {
        name: 'Last 90 Days',
        value: '90d'
    },
]

export const createTimeOption = (required = true): CommandArgument => ({
    name: 'time',
    description: 'Time to display the leaderboard for',
    required,
    default: '-1',
    type: BunCommand.Type.STRING,
    choices: TIME_OPTIONS
} as CommandArgument);
