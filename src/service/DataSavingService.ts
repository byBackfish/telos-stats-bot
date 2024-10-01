import { saveData } from "../../db";
import { getPlayerProfile, streamBatch, type StreamOptions } from "../api";
import type { PlayerProfile } from "../api/struct/player";
import type { PlayerService } from "./PlayerService";

export class DataSavingService {
	constructor(
		private playerServcie: PlayerService,
		private options: DataSavingOptions,
	) {}

	public async start() {
		await this.startSaving();
	}

	private async startSaving() {
		console.log("Starting saving");

		while (true) {
			await this.save();
			await Bun.sleep(this.options.cycleTimeout);
		}
	}

	private async save() {
		console.log(
			`Saving data for ${this.playerServcie.getPlayers().length} uuids`,
		);
		console.log(
			`Progress: 0/${this.playerServcie.getPlayers().length} | Last: None`,
		);
		let i = 0;
		const options: StreamOptions<string, PlayerProfile> = {
			function: getPlayerProfile,
			callback: async (data) => {
				await saveData({
					username: data.username,
					uuid: data.uuid,
					data,
				});
				i++;
				console.log(
					`Progress: ${i}/${this.playerServcie.getPlayers().length} | Last: ${data.username}`,
				);
			},
			timeout: this.options.apiTimeout,
			args: this.playerServcie.getPlayers().map((player) => [player.uuid]),
		};

		await streamBatch(options);
		console.log("Saved data");
	}
}

export type DataSavingOptions = {
	cycleTimeout: number;
	apiTimeout: number;
};
