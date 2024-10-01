import { BunListener } from "@bybackfish/buncord";
import { Client, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import type { CustomClient } from "..";

export default class ReadyListener extends BunListener<CustomClient, "ready"> {
	constructor() {
		super("ready");
	}

	public async execute(_: any) {
		const invite = this.client.generateInvite({
			scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
			permissions: PermissionFlagsBits.Administrator,
		});
		this.client.console.log(
			`Ready as ${this.client.user?.tag}! Invite: ${invite}`,
		);
	}
}
