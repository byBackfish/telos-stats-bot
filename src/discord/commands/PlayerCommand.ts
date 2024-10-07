import {
	BunCommand,
	type CommandArgument,
	type CommandReturnable,
} from "@bybackfish/buncord";
import {
	ActionRow,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonComponent,
	ButtonInteraction,
	ButtonStyle,
	type CommandInteraction,
	EmbedBuilder,
	SelectMenuComponent,
	SelectMenuInteraction,
	StringSelectMenuBuilder,
	StringSelectMenuComponent,
	type StringSelectMenuInteraction,
} from "discord.js";
import type { CustomClient } from "..";
import { playerOption } from "../util/options";
import { getPlayerProfile } from "../../api";
import type { Character, PlayerProfile } from "../../api/struct/player";
import DayJS from "dayjs";
import DayJSRelativeTime from "dayjs/plugin/relativeTime";
import { formatNumber, chunkArray, formatTimeToDuration } from "../util/utils";
import { getEmoji } from "../util/telos-resource";
DayJS.extend(DayJSRelativeTime);

export default class PlayerTrackCommand extends BunCommand<CustomClient> {
	constructor() {
		super("stats", {
			description: "View a player's stats",
			options: [playerOption()],
		});
	}

	YES = "✅";
	NO = "❌";

	CATEGORIES: PlayerStatCategory[] = [
		{
			type: "global",
			name: "General",
			emoji: "📊",
			customId: "geneal",
			createEmbeds: (interaction, data) => {
				// General playe stats
				const embed = this.getDefaultEmbeds(interaction, data);

				if (data.currentServer) {
					embed.addFields([
						{
							name: "Current Server",
							value: data.currentServer,
							inline: true,
						},
					]);
				} else {
					embed.addFields([
						{
							name: "Last Seen",
							value: DayJS(data.lastPlayed).fromNow(),
							inline: true,
						},
					]);
				}

				embed.addFields([
					this.field("Rank", data.rank),
					this.field("Playtime", formatTimeToDuration(data.playTime)),
					this.field("Glory", formatNumber(data.balance)),
					this.field("Selected Glow", data.glow || "None"),
					this.field("Selected Pet", data.companions.selected.pet || "No Pet"),
					this.field(
						"Selected Mount",
						data.companions.selected.mount || "No Mount",
					),
					this.field(
						"Boosts",
						`Loot Boost: ${data.boost.loot ? this.YES : this.NO}
                    Fame Boost: ${data.boost.fame ? this.YES : this.NO}`,
					),
				]);

				return [embed];
			},
		},
		{
			name: "Characters",
			emoji: "👤",
			customId: "characters",
			type: "global",
			createEmbeds: (interaction, data) => {
				const {
					characters: { all: classes },
				} = data;

				return chunkArray(classes, 4).map((chunk, index) => {
					const embed = this.getDefaultEmbeds(interaction, data);

					chunk.forEach((character) => {
						embed.addFields([
							this.field(
								character.type,
								`Level: ${character.level} (${formatNumber(character.fame)})`,
							),
						]);
					});

					return embed;
				});
			},
		},
		{
			name: "Class Info",
			customId: "classInfo",
			emoji: "ℹ️",
			type: "class",
			createEmbeds: async (interaction, data, { character }) => {
                const ruleset = await getEmoji(this.client, "img/ruleset", character.ruleset.type);

				const embed = this.getDefaultEmbeds(interaction, data).addFields([
                    this.field("Ruleset", ruleset),
					this.field("Class", character.type),
					this.field("Level", character.level),
					this.field("Fame", character.fame),
					this.field("Playtime", formatTimeToDuration(character.playTime)),
					this.field("Runes", character.runes.join(", ")),
				]);



				return [embed];
			},
		},
		{
			name: "Statistics",
			type: "class",
			emoji: "⚔️",
			customId: "statistics",
			createEmbeds: (interaction, data, { character }) => {
				const { statistics } = character;
				const embeds = chunkArray(Object.entries(statistics), 10).map(
					(chunk) => {
						const embed = this.getDefaultEmbeds(interaction, data).addFields(
							chunk.map(([name, value]) => {
								return this.field(name, value, true);
							}),
						);
						return embed;
					},
				);
				return embeds;
			},
		},
		{
			name: "Potions",
			type: "class",
			emoji: "🧪",
			customId: "potions",
			createEmbeds: (interaction, data, { character }) => {
				const {
					stats: { values },
				} = character;
				const embeds = chunkArray(Object.entries(values), 12).map((chunk) => {
					const embed = this.getDefaultEmbeds(interaction, data).addFields(
						chunk.map(([name, value]) => {
							return this.field(name, value);
						}),
					);
					return embed;
				});
				return embeds;
			},
		},
		{
			name: "Item Filters",
			type: "class",
			emoji: "🔍",
			customId: "itemFilters",
			createEmbeds: (interaction, data, { character }) => {
				const {
					itemFilter: { components },
				} = character;

				const embed = this.getDefaultEmbeds(interaction, data);

				components.forEach((component) => {
					if (component.type == "tier") {
						embed.addFields(
							this.field("Tier Requirement", `>=${component.cutoff}`),
						);
					} else if (component.type == "class") {
						embed.addFields(
							this.field("Class Requirement", component.whitelist.join(", ")),
						);
					} else if (component.type == "potion") {
						embed.addFields(
							this.field(
								"Potion Requirement",
								`Normal: ${component.allowNormal ? this.YES : this.NO}
                            Greater: ${component.allowGreater ? this.YES : this.NO}`,
							),
						);
					}
				});

				return [embed];
			},
		},
		{
			name: "Inventory",
			emoji: "🎒",
			customId: "inventory",
			type: "class",
			createEmbeds: async (interaction, data, { character }) => {
				const {
					inventory: { armor, extra, storage, selectedSlot },
				} = character;

				const embed = this.getDefaultEmbeds(interaction, data);

				const offhand = extra[0] || { type: "empty" };
				const offhandName =
					offhand.type == "empty" ? "None" : offhand.identifier;

				const mainhand = storage[selectedSlot] || { type: "empty" };
				const mainhandName =
					mainhand.type == "empty" ? "None" : mainhand.identifier;

				let armorString = "";
                for await (const item of armor.reverse()) {
                    const name = item.type == "empty" ? "empty" : item.identifier;
                    armorString += `${await getEmoji(this.client, "assets/item", name)} ${name}\n`;
                }

				embed.addFields([
					this.field("Armor", armorString),
					this.field(
						"Mainhand",
						`${await getEmoji(this.client, "assets/item", mainhandName)} ${mainhandName}`,
						true,
					),
					this.field(
						"Offhand",
						`${await getEmoji(this.client, "assets/item", offhandName)} ${offhandName}`,
						true,
					),
				]);

                const hotbar = storage.slice(0, 9);
                const other = storage.slice(9);

                let description = ""
                for await (const chunk of chunkArray([...other, ...hotbar], 9)) {
                    for await (const item of chunk) {
                        const name = item.type == "empty" ? "empty" : item.identifier;
                        description += `${await getEmoji(this.client, "assets/item", name)}`
                    }
                    description += "\n";
                }

                embed.setDescription(description);

				return [embed];
			},
		},
        {
            name: 'Quests',
            emoji: '📜',
            customId: 'quests',
            type: 'global',
            createEmbeds: async (interaction, data) => {
                const { quests: { progress } } = data;
				const quests = Object.entries(progress).sort((a, b) => {
                    const [aKey, aValue] = a;
                    const [bKey, bValue] = b;

                    const aProgress = aValue.value / aValue.limit;
                    const bProgress = bValue.value / bValue.limit;

                    if (aProgress !== bProgress) {
                        return bProgress - aProgress;
                    }

                    if (aValue.limit !== bValue.limit) {
                        return aValue.limit - bValue.limit;
                    }

                    return aKey.localeCompare(bKey);
                });

                const tutorialQuests = quests.filter(([name, value]) => name.startsWith('realm:starter_'));
                const weeklyQuests = quests.filter(([name, value]) => !name.startsWith('realm:starter_'));

                const embeds = [tutorialQuests, weeklyQuests].map((quests) => {
                    const embed = this.getDefaultEmbeds(interaction, data);

                    for (const [name, value] of quests) {
                        embed.addFields(this.field(name, `${value.value}/${value.limit}`, false));
                    }

                    return embed
                })

                return embeds;
            }
        }
	];

	public async execute(
		interaction: CommandInteraction,
		{ player }: { player: string },
	): Promise<CommandReturnable> {
		let { id } = await interaction.reply({
			content: "Loading...",
		});

		const data = await getPlayerProfile(player).catch((error) => {
			interaction.editReply({
				content: "Failed to fetch player data",
			});
		});

		if (!data) return;

		this.sendMessage(interaction, {
			selectedCategory: this.CATEGORIES[0],
			data: data,
			id,
			selectedClassId: "",
			selectedClass: undefined,
		});
	}

	async sendMessage(
		interaction: CommandInteraction,
		options: {
			selectedCategory: PlayerStatCategory;
			data: PlayerProfile;
			id: string;
			selectedClassId: string;
			selectedClass: Character | undefined;
		},
	) {
		let { selectedCategory, data, id, selectedClassId, selectedClass } =
			options;

		if (selectedCategory.type == "class" && !selectedClass) {
			return interaction.editReply({
				content: "This category requires a class to be selected",
			});
		}

		const possibleCategories = this.CATEGORIES.filter((category) => {
			if (category.type == "global") return true;
			return selectedClass != null;
		});

		const embeds =
			selectedCategory.type == "global"
				? await selectedCategory.createEmbeds(interaction, data)
				: await selectedCategory.createEmbeds(interaction, data, {
						character: selectedClass!!,
					});

		const buttons = this.createButtons(possibleCategories, id);
		const classSelect = this.createClassSelectMenu(
			selectedClassId,
			data.characters.all,
			id,
		);

		let { id: newId } = await interaction.editReply({
            content: "",
			embeds: embeds,
			components: [classSelect, ...buttons] as any,
		});

		this.client
			.await<SelectMenuInteraction>(`classSelect-${id}`)
			.then((select) => {
				console.log("selected class", select.values);
				const selectedClassId = select.values[0];
				const selectedClass = data.characters.all.find(
					(character) => character.uniqueId == selectedClassId,
				);

				this.sendMessage(interaction, {
					selectedCategory,
					data,
					id: newId,
					selectedClassId,
					selectedClass,
				});

				select.deferUpdate();
			});

		this.CATEGORIES.forEach((category) => {
			this.client
				.await<ButtonInteraction>(`${category.customId}-${id}`)
				.then((button) => {
					console.log("selected category", button.customId);
					const categoryId = button.customId.split("-")[0];
					const selectedCategory = this.CATEGORIES.find(
						(c) => c.customId == categoryId,
					);

					this.sendMessage(interaction, {
						selectedCategory: selectedCategory!!,
						data,
						id: newId,
						selectedClassId,
						selectedClass,
					});

					button.deferUpdate();
				});
		});
	}

	createButtons(
		categories: PlayerStatCategory[],
		id: string,
	): ActionRowBuilder[] {
		return chunkArray(categories, 5).map((chunk) => {
			const row = new ActionRowBuilder();

			const buttons = chunk.map((category) => {
				return new ButtonBuilder()
					.setCustomId(`${category.customId}-${id}`)
					.setLabel(category.name)
					.setEmoji(category.emoji)
					.setStyle(ButtonStyle.Primary);
			});

			row.addComponents(buttons);
			return row;
		});
	}

	createClassSelectMenu(
		selectedClass: string,
		classes: Character[],
		id: string,
	): ActionRowBuilder {
		const menu = new StringSelectMenuBuilder()
			.setCustomId(`classSelect-${id}`)
			.setPlaceholder("Select a Class")
			.setMinValues(1)
			.setMaxValues(1);

		menu.addOptions(
			classes.map((character) => {
				return {
					label: `${character.type} (${character.level})`,
					default: character.uniqueId == selectedClass,
					value: character.uniqueId,
				};
			}),
		);

		const row = new ActionRowBuilder();
		row.addComponents(menu);
		return row;
	}

	field(name: string, value: unknown, inline = false) {
		if (typeof value === "number") {
			value = formatNumber(value);
		}
		return {
			name,
			value: `${value}`,
			inline,
		};
	}

	getDefaultEmbeds(interaction: CommandInteraction, data: PlayerProfile) {
		return new EmbedBuilder()
			.setColor("Aqua")
			.setTitle(`Stats for ${data.username}`)
			.setFooter({
				text: `Requested by ${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL(),
			})

	}
}

type PlayerStatCategory = (
	| {
			type: "global";
			createEmbeds: (
				interaction: CommandInteraction,
				data: PlayerProfile,
			) => Promise<EmbedBuilder[]> | EmbedBuilder[];
	  }
	| {
			type: "class";
			createEmbeds: (
				interaction: CommandInteraction,
				data: PlayerProfile,
				settings: { character: Character },
			) => Promise<EmbedBuilder[]> | EmbedBuilder[];
	  }
) & {
	emoji: string;
	name: string;
	customId: string;
};
