import { getPlayerProfile } from "./api";

const data = {};

for await (const name of ["byBackfish", "JsMew", "evilpope", "Looniitick"]) {
	const profile = await getPlayerProfile(name);

	const stats = Object.keys(profile.statistics).filter((stat) =>
		stat.startsWith("rotmc:boss"),
	);

	stats.forEach((stat) => {
		const value = profile.statistics[stat];
		if (!data[stat]) {
			data[stat] = {};
			console.log(stat);
		}
	});
}

Bun.write("stats.json", JSON.stringify(data, null, 2));
