import {
	BunCommand,
	type CommandArgument,
	type CommandReturnable,
} from "@bybackfish/buncord";
import {
	ActionRow,
	ActionRowBuilder,
	ButtonComponent,
	type CommandInteraction,
	EmbedBuilder,
	SelectMenuComponent,
	StringSelectMenuBuilder,
	StringSelectMenuComponent,
	type StringSelectMenuInteraction,
} from "discord.js";
import type { CustomClient } from "..";
import {
	createTimeOption,
	leaderboardStatOption,
	playerOption,
	TIME_OPTIONS,
} from "../util/options";
import { getStatAtTime, getStatNow } from "../../../db";
import ms from "ms";

export default class PlayerTrackCommand extends BunCommand<CustomClient> {
	constructor() {
		super("player-track", {
			description: "Track Players Statistics",
			options: [
				playerOption("uuid"),
				leaderboardStatOption(false),
				createTimeOption(false),
			],
		});
	}

	public async execute(
		interaction: CommandInteraction,
		{
			player,
			type,
			time,
		}: { player: string; type: string | undefined; time: string },
	): Promise<CommandReturnable> {
		if (!type) {
			const firstType = this.client.leaderboardTypes.find(
				(stat) => stat.category === "player",
			);
			if (!firstType) return;
			type = firstType.name;
		}

		const message = await interaction.reply({
			content: "Loading...",
			ephemeral: true,
		});

		await this.sendDataMessage(interaction, message.id, type, player, time);
	}

	async sendDataMessage(
		interaction: CommandInteraction,
		id: string,
		type: string,
		player: string,
		time: string,
	) {
		const stat = this.client.leaderboardTypes.find(
			(statType) => statType.name.toLowerCase() === type.toLowerCase(),
		);
		if (!stat) return interaction.editReply({ content: "Invalid Stat Type" });
		if (stat.category !== "player")
			return interaction.editReply({
				content: "Stat type is not applicable to players",
			});

		time = time || "-1";
		const thenTime =
			time === "-1" ? new Date(0) : new Date(Date.now() - ms(time));

		const start = Date.now();

		const isUuid = player.length > 16;
		const query = isUuid ? { uuid: player } : { username: player };

		const oldData = await getStatAtTime<number>(query, stat, thenTime);
		if (!oldData)
			return interaction.editReply({
				content: `Player's old data could not found`,
			});

		const newData = await getStatNow<number>(query, stat);
		if (!newData)
			return interaction.editReply({
				content: `Player's data could not found`,
			});

		const oldValue = oldData.value;
		const newValue = newData.value;

		const diff = newValue - oldValue;
		const diffString = diff > 0 ? `+${diff}` : `${diff}`;

		const embed = new EmbedBuilder()
			.setColor(diff == 0 ? "Grey" : diff > 0 ? "Green" : "Red")
			.setTitle(`${stat.name} for ${newData.username}`)
			.addFields([
				{ name: "Old Value", value: oldValue.toString(), inline: true },
				{ name: "New Value", value: newValue.toString(), inline: true },
				{ name: "Difference", value: diffString, inline: true },
			])
			.setTimestamp()
			.setDescription(
				`Found Saved Data from: <t:${Math.round(oldData.time.getTime() / 1000)}:R>`,
			)
			.setFooter({
				text: `Requested by ${interaction.user.tag} | Took ${Date.now() - start}ms`,
				iconURL: interaction.user.displayAvatarURL(),
			});

		const response = await interaction.editReply({
			content: "",
			embeds: [embed],
			components: this.buildCategorySelection(type, time, id) as any,
		});

		this.client
			.await<StringSelectMenuInteraction>(`player-track-category-${id}`, 1)
			.then((select) => {
				if (select.values.length === 0) {
					return select.reply({
						content: "You must select a category",
						ephemeral: true,
					});
				}
				select.deferUpdate();
				this.sendDataMessage(
					interaction,
					response.id,
					select.values[0],
					player,
					time,
				);
			});

		this.client
			.await<StringSelectMenuInteraction>(`player-track-time-${id}`, 1)
			.then((select) => {
				if (select.values.length === 0) {
					return select.reply({
						content: "You must select a time",
						ephemeral: true,
					});
				}
				select.deferUpdate();
				this.sendDataMessage(
					interaction,
					response.id,
					type,
					player,
					select.values[0],
				);
			});
	}

	buildCategorySelection(
		selectedCategory: string,
		selectedTime: string,
		id: string,
	): ActionRowBuilder[] {
		const categories = this.client.leaderboardTypes.filter(
			(stat) => stat.category === "player",
		);
		const rows: ActionRowBuilder[] = [];
		for (let i = 0; i < 25; i += 25) {
			const options = categories.slice(i, i + 25).map((stat) => ({
				label: stat.name,
				value: stat.name.toLowerCase(),
				default: stat.name.toLowerCase() === selectedCategory.toLowerCase(),
			}));
			const builder = new StringSelectMenuBuilder()
				.addOptions(options)
				.setMinValues(1)
				.setMaxValues(1)
				.setCustomId(`player-track-category-${id}`)
				.setPlaceholder("Select a category");

			const row = new ActionRowBuilder();
			row.addComponents(builder);
			rows.push(row);
		}

		for (let i = 0; i < TIME_OPTIONS.length; i += 25) {
			const options = TIME_OPTIONS.slice(i, i + 25).map((time) => ({
				label: time.name,
				value: time.value,
				default: time.value === selectedTime,
			}));
			const builder = new StringSelectMenuBuilder()
				.addOptions(options)
				.setMinValues(1)
				.setMaxValues(1)
				.setCustomId(`player-track-time-${id}`)
				.setPlaceholder("Select a time");

			const row = new ActionRowBuilder();
			row.addComponents(builder);
			rows.push(row);
		}

		return rows;
	}
}
