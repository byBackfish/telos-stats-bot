import { BunCommand, type CommandArgument, type CommandReturnable } from '@bybackfish/buncord';
import {
    ActionRow,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonComponent,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  SelectMenuComponent,
  StringSelectMenuBuilder,
  StringSelectMenuComponent,
  StringSelectMenuInteraction,
  type EmbedField,
} from 'discord.js';
import type { CustomClient } from '..';
import { createTimeOption, leaderboardStatOption, playerOption, TIME_OPTIONS } from '../util/options';
import { getTopGainsWithin } from '../../../db';
import ms from 'ms'
const millify = (num: number) => {
    // add commas to the number
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default class LeaderboardGainCommand extends BunCommand<CustomClient> {

    ENTIRES_PER_PAGE = 6

  constructor() {
    super('gain-leaderboard', {
      description: 'See the players that gained the most score in a certain time period',
      options: [
        leaderboardStatOption(true),
        createTimeOption(false)
      ],
    });
  }

  public async execute(
    interaction: CommandInteraction,
    { type, time }: { type: string, time: string | undefined },
  ): Promise<CommandReturnable> {
    let message = await interaction.reply({
        content: "Loading...",
        ephemeral: true
    })

    await this.sendDataMessage(interaction, message.id, 0, type, time || '-1');
  }

  async sendDataMessage(interaction: CommandInteraction, id: string, page: number, type: string, time: string, data?: {
    total: number;
    gainData: {
        username: string;
        uuid: string;
        gain: number;
        time: Date;
        oldStat: number;
        newStat: number;
    }[]
  }) {
    const stat = this.client.leaderboardTypes.find(statType => statType.name.toLowerCase() === type.toLowerCase())
    if (!stat) return interaction.editReply({content: 'Invalid Stat Type'});
    if(stat.category !== 'player') return interaction.editReply({content: 'Stat type is not applicable to players'});

    let thenTime = time === "-1" ? new Date(0) : new Date(Date.now() - (ms(time)));
    const start = Date.now();

    if(!data) {
        data = await getTopGainsWithin(stat, thenTime) || {total: 0, gainData: []};
    }

    const { total, gainData } = data;
    if (!gainData) return interaction.editReply({content: `Player's data could not found`});

    const startIndex = page * this.ENTIRES_PER_PAGE;
    const fields: EmbedField[] = gainData.slice(startIndex, startIndex+this.ENTIRES_PER_PAGE).map((data, index) => {
        return {
            name: `${index+1 + (page*this.ENTIRES_PER_PAGE)}. ${data.username}`,
            value: `+${data.gain} (${millify(data.oldStat)} -> ${millify(data.newStat)})`,
            inline: true
        }
    })

    const embed = new EmbedBuilder()
        .setColor("Aqua")
        .setTitle(`${stat.name}'s Gain Leaderboard`)
        .addFields(fields)
        .setTimestamp()
        .setDescription(`Scanned ${total} players`)
        .setFooter({
            text: `Requested by ${interaction.user.tag} | Took ${Date.now() - start}ms`,
            iconURL: interaction.user.displayAvatarURL()
        })

    const maxPage = Math.ceil(gainData.length / this.ENTIRES_PER_PAGE);
    const response = await interaction.editReply({
        content: '',
        embeds: [embed],
        components: this.buildCategorySelection(type, time, page, maxPage, id) as any
    })

    this.client.await<StringSelectMenuInteraction>(`player-gain-leaderboard-category-${id}`, 1).then(async (select) => {
        if(select.values.length === 0) {
            return select.reply({content: 'You must select a category', ephemeral: true});
        }
        await this.sendDataMessage(interaction, response.id, 0, select.values[0], time);
        select.deferUpdate();
    })

    this.client.await<StringSelectMenuInteraction>(`player-gain-leaderboard-time-${id}`, 1).then(async (select) => {
        if(select.values.length === 0) {
            return select.reply({content: 'You must select a time', ephemeral: true});
        }
        await this.sendDataMessage(interaction, response.id, 0, type, select.values[0]);
        select.deferUpdate();
    })

    this.client.await<ButtonInteraction>(`player-gain-leaderboard-page-down-${id}`, 1).then(async (button) => {
        await this.sendDataMessage(interaction, response.id, page-1, type, time, data);
        button.deferUpdate();
    })

    this.client.await<ButtonInteraction>(`player-gain-leaderboard-page-up-${id}`, 1).then(async (button) => {
        await this.sendDataMessage(interaction, response.id, page+1, type, time, data);
        button.deferUpdate();
    })
  }

  buildCategorySelection(selectedCategory: string, selectedTime: string, currentPage: number, maxPage: number, id: string): ActionRowBuilder[] {
    const categories = this.client.leaderboardTypes.filter(stat => stat.category === 'player');
    const rows: ActionRowBuilder[] = [];
    for (let i = 0; i < 25; i += 25) {
      const options = categories.slice(i, i + 25).map((stat) => ({
        label: stat.name,
        value: stat.name.toLowerCase(),
        default: stat.name.toLowerCase() === selectedCategory.toLowerCase(),
      }));
      const builder = new StringSelectMenuBuilder().addOptions(options).setMinValues(1).setMaxValues(1).setCustomId(`player-gain-leaderboard-category-${id}`).setPlaceholder('Select a category');

      const row = new ActionRowBuilder()
      row.addComponents(builder);
      rows.push(row);
    }

    for (let i = 0; i < TIME_OPTIONS.length; i += 25) {
      const options = TIME_OPTIONS.slice(i, i + 25).map((time) => ({
        label: time.name,
        value: time.value,
        default: time.value === selectedTime,
      }));
      const builder = new StringSelectMenuBuilder().addOptions(options).setMinValues(1).setMaxValues(1).setCustomId(`player-gain-leaderboard-time-${id}`).setPlaceholder('Select a time');

      const row = new ActionRowBuilder()
      row.addComponents(builder);
      rows.push(row);
    }

    // page navigation button.
    // <Left> <Page 1> <Right>
    const navigation = new ActionRowBuilder()
    const left = new ButtonBuilder().setCustomId(`player-gain-leaderboard-page-down-${id}`).setLabel('Left').setStyle(ButtonStyle.Primary).setEmoji('⬅️')
    const current = new ButtonBuilder().setCustomId(`player-gain-leaderboard-page-${id}`).setLabel(`Page ${currentPage+1}/${maxPage}`).setStyle(ButtonStyle.Secondary).setDisabled(true).setEmoji('📄')
    const right = new ButtonBuilder().setCustomId(`player-gain-leaderboard-page-up-${id}`).setLabel('Right').setStyle(ButtonStyle.Primary).setEmoji('➡️')

    if(currentPage <= 0) left.setDisabled(true)
    if(currentPage >= maxPage-1) right.setDisabled(true)

    navigation.addComponents(left, current, right)
    rows.push(navigation)

    return rows;
  }
}
