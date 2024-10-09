import type { CustomClient } from "..";
import { Renames } from "../../../data/renames";

export const getEmoji = async (
	client: CustomClient,
	path: CdnPath,
	assetName: string,
) => {
	const name = (Renames[assetName] ?? assetName).toLowerCase();
	const emojiName = name.replace(/-| /g, "_");
	const error = client.application?.emojis.cache.find(
		(emoji) => emoji.name === "error",
	);
	if (name === "None") {
		return error;
	}
	const emoji = client.application?.emojis.cache.find(
		(emoji) => emoji.name === emojiName,
	);

	if (!emoji) {
		console.log(`Creating emoji ${name}`);
		const created = await createEmoji(client, path, name, emojiName).catch(
			(e) => {
				console.error(`Failed to create emoji ${name}`, e);
				return null;
			},
		);

		if (!created) {
			return error;
		}

		return created;
	}
	return emoji;
};

const createEmoji = async (
	client: CustomClient,
	path: CdnPath,
	telosName: string,
	emojiName: string,
) => {
	return await client.application?.emojis
		.create({
			name: emojiName,
			attachment: `https://cdn.telosrealms.com/${path}/${telosName}.png`,
		})
		.catch((error) => {
			console.error(`Failed to create emoji ${emojiName}`);
			return null;
		});
};

type CdnPath = "img/ruleset" | "assets/item";
