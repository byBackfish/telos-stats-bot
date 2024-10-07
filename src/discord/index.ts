import { BunClient } from "@bybackfish/buncord";
import { IntentsBitField } from "discord.js";
import { join } from "node:path";

export class CustomClient extends BunClient<CustomClient> {
	constructor() {
		super({
			intents: [IntentsBitField.Flags.Guilds],
			commands: {
				commandDirPath: join(__dirname, "./commands"),
			},
			listeners: {
				listenerDirPath: join(__dirname, "./listener"),
			},
			token: process.env.DISCORD_TOKEN,
		});

		this.on("ready", () => {
			this.application?.emojis.fetch();
		});
	}
}
