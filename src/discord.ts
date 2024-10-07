import { CustomClient } from "./discord/index";
import { getEmoji } from "./discord/util/telos-resource";
import "./env";

(async () => {
	const client = new CustomClient();
	await client.login();
})();
