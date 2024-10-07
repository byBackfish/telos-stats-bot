import {
    BunCommand,
    type CommandArgument,
    type CommandReturnable,
} from "@bybackfish/buncord";
import {
    ActionRow,
    ActionRowBuilder,
    type APIActionRowComponent,
    type APIMessageActionRowComponent,
    ButtonBuilder,
    ButtonComponent,
    type ButtonInteraction,
    ButtonStyle,
    type CommandInteraction,
    EmbedBuilder,
    type JSONEncodable,
    SelectMenuComponent,
    type SelectMenuInteraction,
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
import {
    formatNumber,
    chunkArray,
    formatTimeToDuration,
    getRealmName,
} from "../util/utils";
import { getEmoji } from "../util/telos-resource";
import { users } from "../../../db/schema";
import { db } from "../../../db";
import { desc } from "drizzle-orm";
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
            createEmbeds: async (interaction, data) => {
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

                const actualPetName = getRealmName(data.companions.selected.pet);

                const petEmoji = await getEmoji(
                    this.client,
                    "assets/item",
                    actualPetName || "None",
                );
                const petName = actualPetName || "No Pet";

                const actualMountName = getRealmName(data.companions.selected.mount);

                const mountEmoji = await getEmoji(
                    this.client,
                    "assets/item",
                    actualMountName || "None",
                );
                const mountName = actualMountName || "No Mount";

                embed.addFields([
                    this.field("Rank", data.rank),
                    this.field("Playtime", formatTimeToDuration(data.playTime)),
                    this.field("Glory", `❖ ${formatNumber(data.balance)}`),
                    this.field("Selected Glow", data.glow || "None"),
                    this.field("Selected Pet", `${petEmoji} ${petName}`),
                    this.field("Selected Mount", `${mountEmoji} ${mountName}`),
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

                    for (const character of chunk) {
                        embed.addFields([
                            this.field(
                                character.type,
                                `Level: ${character.level}(${formatNumber(character.fame)})`,
                            ),
                        ]);
                    }

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
                const ruleset = await getEmoji(
                    this.client,
                    "img/ruleset",
                    character.ruleset.type,
                );

                const embed = this.getDefaultEmbeds(interaction, data).addFields([
                    this.field("Ruleset", ruleset),
                    this.field("Class", character.type),
                    this.field("Level", character.level),
                    this.field("Fame", character.fame),
                    this.field("Death Count", character.statistics["rotmc:deaths"]),
                    this.field("Playtime", formatTimeToDuration(character.playTime)),
                ]);

                if (character.runes.length > 0) {
                    embed.addFields([
                        this.field("Runes", character.runes.join(", "))
                    ])
                }

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
                const embeds = chunkArray(Object.entries(statistics).sort((a, b) => b[1] - a[1]), 10).map(
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

                for (const component of components) {
                    if (component.type === "tier") {
                        embed.addFields(
                            this.field("Tier Requirement", `>= ${component.cutoff}`),
                        );
                    } else if (component.type === "class") {
                        embed.addFields(
                            this.field("Class Requirement", component.whitelist.join(", ")),
                        );
                    } else if (component.type === "potion") {
                        embed.addFields(
                            this.field(
                                "Potion Requirement",
                                `Normal: ${component.allowNormal ? this.YES : this.NO}
                            Greater: ${component.allowGreater ? this.YES : this.NO}`,
                            ),
                        );
                    }
                }

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
                    offhand.type === "empty" ? "None" : offhand.identifier;

                const mainhand = storage[selectedSlot] || { type: "empty" };
                const mainhandName =
                    mainhand.type === "empty" ? "None" : mainhand.identifier;

                let armorString = "";
                for await (const item of armor.reverse()) {
                    const name = item.type === "empty" ? "empty" : item.identifier;
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

                let description = "";
                for await (const chunk of chunkArray([...other, ...hotbar], 9)) {
                    for await (const item of chunk) {
                        const name = item.type === "empty" ? "empty" : item.identifier;
                        description += `${await getEmoji(this.client, "assets/item", name)}`;
                    }
                    description += "\n";
                }

                embed.setDescription(description);

                return [embed];
            },
        },
        {
            name: "Quests",
            emoji: "📜",
            customId: "quests",
            type: "global",
            createEmbeds: async (interaction, data) => {
                const {
                    quests: { progress },
                } = data;
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

                const tutorialQuests = quests.filter(([name, value]) =>
                    name.startsWith("realm:starter_"),
                );
                const weeklyQuests = quests.filter(
                    ([name, value]) => !name.startsWith("realm:starter_"),
                );

                const embeds = [tutorialQuests, weeklyQuests].map((quests) => {
                    const embed = this.getDefaultEmbeds(interaction, data);

                    for (const [name, value] of quests) {
                        embed.addFields(
                            this.field(name, `${value.value} / ${value.limit}`, false),
                        );
                    }

                    return embed;
                });

                return embeds;
            },
        },
        {
            name: "Companions",
            emoji: "🐾",
            customId: "companions",
            type: "global",
            createEmbeds: async (interaction, data) => {
                const { companions } = data;

                const embed = this.getDefaultEmbeds(interaction, data);

                const pets = await Promise.all(companions.unlocked
                    .filter((companion) => companion.startsWith("realm:pet"))
                    .map((pet) => getRealmName(pet))
                    .filter((pet) => pet != null).map(async (pet) => ({ name: pet, emoji: await getEmoji(this.client, "assets/item", pet) })));
                ;
                const mounts = await Promise.all(companions.unlocked
                    .filter((companion) => companion.startsWith("realm:mount"))
                    .map((mount) => getRealmName(mount))
                    .filter((mount) => mount != null).map(async (mount) => ({ name: mount, emoji: await getEmoji(this.client, "assets/item", mount) })));

                const selectedPet = getRealmName(companions.selected.pet);
                const selectedMount = getRealmName(companions.selected.mount);

                const description = `\`Pets\`
                ${(pets.map(({ name, emoji }) => (name === selectedPet ? `${emoji} **>> ${name} <<** ` : `${emoji} ${name}`))).join("\n")}

                \`Mounts\`
                ${(mounts.map(({ name, emoji }) => (name === selectedMount ? `${emoji} **>> ${name} <<** ` : `${emoji} ${name}`))).join("\n")}`;

                embed.setDescription(description);

                return [embed];
            },
        },
    ];

    public async execute(
        interaction: CommandInteraction,
        { player }: { player: string },
    ): Promise<CommandReturnable> {
        const { id } = await interaction.reply({
            content: "Loading...",
        });

        const data = await getPlayerProfile(player).catch((error) => {
            interaction.editReply({
                content: "Failed to fetch player data",
            });
        });

        if (!data) return;
        db.insert(users)
            .values({
                data,
                username: data.username,
                uuid: data.uniqueId,
                time: new Date(),
            })
            .onConflictDoUpdate({
                target: users.uuid,
                set: { data, time: new Date() },
            })
            .execute();

        const selectedClassId = data.characters.selected;
        const selectedClass = data.characters.all.find(
            (character) => character.uniqueId === selectedClassId,
        );
        this.sendMessage(interaction, {
            selectedCategory: this.CATEGORIES[0],
            data: data,
            id,
            selectedClassId: selectedClassId,
            currentPage: 0,
            selectedClass: selectedClass,
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
            currentPage: number;
        },
    ) {
        const { selectedCategory, data, id, selectedClassId, selectedClass } =
            options;

        if (selectedCategory.type === "class" && !selectedClass) {
            return interaction.editReply({
                content: "This category requires a class to be selected",
            });
        }

        const possibleCategories = this.CATEGORIES.filter((category) => {
            if (category.type === "global") return true;
            return selectedClass != null;
        });

        const embeds =
            selectedClass == null
                ? []
                : selectedCategory.type === "global"
                    ? await selectedCategory.createEmbeds(interaction, data)
                    : await selectedCategory.createEmbeds(interaction, data, {
                        character: selectedClass || options.selectedClass,
                    });
        const page = Math.min(options.currentPage || 0, embeds.length - 1);
        const embed = embeds[page];

        const buttons = this.createButtons(possibleCategories, id);
        const classSelect = this.createClassSelectMenu(
            selectedClassId,
            data.characters.all,
            id,
        );

        const components = [classSelect, ...buttons];

        const hasPagination = embeds.length > 1;
        if (hasPagination) {
            const pageButtons = this.createPageButtons(
                id,
                options.currentPage,
                embeds.length - 1,
            );
            components.push(pageButtons);
        }

        const { id: newId } = await interaction.editReply({
            content: "",
            embeds: [embed],
            components: components as JSONEncodable<
                APIActionRowComponent<APIMessageActionRowComponent>
            >[],
        });

        this.client
            .await<SelectMenuInteraction>(`classSelect-${id}`)
            .then((select) => {
                const selectedClassId = select.values[0];
                const selectedClass = data.characters.all.find(
                    (character) => character.uniqueId === selectedClassId,
                );

                this.sendMessage(interaction, {
                    selectedCategory,
                    data,
                    id: newId,
                    selectedClassId,
                    selectedClass,
                    currentPage: 0,
                });

                select.deferUpdate();
            });

        for (const category of this.CATEGORIES) {
            this.client
                .await<ButtonInteraction>(`${category.customId}-${id}`)
                .then((button) => {
                    const categoryId = button.customId.split("-")[0];
                    const selectedCategory =
                        this.CATEGORIES.find((c) => c.customId === categoryId) ||
                        options.selectedCategory;
                    console.log(`Switching from ${options.selectedCategory.name}`);

                    this.sendMessage(interaction, {
                        selectedCategory,
                        data,
                        id: newId,
                        selectedClassId,
                        selectedClass,
                        currentPage: 0,
                    });

                    button.deferUpdate();
                });
        }
        if (hasPagination) {
            this.client.await<ButtonInteraction>(`back-${id}`).then((button) => {
                this.sendMessage(interaction, {
                    selectedCategory,
                    data,
                    id: newId,
                    selectedClassId,
                    selectedClass,
                    currentPage: page - 1,
                });

                button.deferUpdate();
            });

            this.client.await<ButtonInteraction>(`forward-${id}`).then((button) => {
                this.sendMessage(interaction, {
                    selectedCategory,
                    data,
                    id: newId,
                    selectedClassId,
                    selectedClass,
                    currentPage: page + 1,
                });

                button.deferUpdate();
            });
        }
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
                    default: character.uniqueId === selectedClass,
                    value: character.uniqueId,
                };
            }),
        );

        const row = new ActionRowBuilder();
        row.addComponents(menu);
        return row;
    }

    createPageButtons(
        id: string,
        currentPage: number,
        maxPage: number,
    ): ActionRowBuilder {
        const row = new ActionRowBuilder();
        const backButton = new ButtonBuilder()
            .setCustomId(`back-${id}`)
            .setEmoji("⬅️")
            .setStyle(ButtonStyle.Primary);
        const forwardButton = new ButtonBuilder()
            .setCustomId(`forward-${id}`)
            .setEmoji("➡️")
            .setStyle(ButtonStyle.Primary);
        const pageButton = new ButtonBuilder()
            .setCustomId(`page-${id}`)
            .setLabel(`${currentPage + 1}/${maxPage + 1}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        if (currentPage === 0) {
            backButton.setDisabled(true);
        } else if (currentPage === maxPage) {
            forwardButton.setDisabled(true);
        }

        row.addComponents([backButton, pageButton, forwardButton]);
        return row;
    }

    field(name: string, value: unknown, inline = false) {
        let formattedValue = value;
        if (typeof value === "number") {
            formattedValue = formatNumber(value);
        }
        return {
            name,
            value: `${formattedValue}`,
            inline,
        };
    }

    getDefaultEmbeds(interaction: CommandInteraction, data: PlayerProfile) {
        const imageUrl = `https://crafatar.com/avatars/${data.uniqueId}.jpg`;
        return new EmbedBuilder()
            .setColor("Aqua")
            .setTitle(`Stats for ${data.username}`)
            .setFooter({
                text: `Requested by ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
        //.setThumbnail(imageUrl);

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
