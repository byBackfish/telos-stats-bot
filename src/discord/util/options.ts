import { BunCommand, type CommandArgument } from "@bybackfish/buncord";
import type { AutocompleteInteraction } from "discord.js";
import type { CustomClient } from "..";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { LEADERBOARD_TYPES } from "../../leaderboard-types";

export const playerOption = (): CommandArgument =>
	({
		name: "player",
		description: "Player's Username",
		required: true,
		autocomplete: true,
		type: BunCommand.Type.STRING,
		onAutocomplete: async (
			client: CustomClient,
			interaction: AutocompleteInteraction,
		) => {
			const current = interaction.options.getFocused();
			const players = (
				await db
					.select({
						username: users.username,
					})
					.from(users)
					.groupBy(({ username }) => username)
			)
				.filter(({ username }) =>
					username.toLowerCase().includes(current.toLowerCase()),
				)
				.slice(0, 25);

			return players.map((player) => ({
				name: player.username,
				value: player.username,
			}));
		},
	}) as CommandArgument;

export const leaderboardStatOption = (required = true): CommandArgument =>
	({
		name: "type",
		description: "Stat to display on the leaderboard",
		required,
		type: BunCommand.Type.STRING,
		autocomplete: true,
		onAutocomplete: async (
			client: CustomClient,
			interaction: AutocompleteInteraction,
		) => {
			const current = interaction.options.getFocused();
			return LEADERBOARD_TYPES.filter((type) =>
				type.name.toLowerCase().includes(current.toLowerCase()),
			)
				.slice(0, 25)
				.map((type) => ({
					name: type.name,
					value: type.name,
				}));
		},
	}) as CommandArgument;
