import { db } from "./db";
import type { PlayerProfile } from "../src/api/struct/player";
import { users } from "./schema";
import {
	and,
	asc,
	desc,
	eq,
	gt,
	gte,
	lt,
	max,
	min,
	type SQL,
	sql,
} from "drizzle-orm";
import type { LeaderboardType } from "../src/leaderboard-types";

type PlayerQuery =
	| {
			username: string;
	  }
	| {
			uuid: string;
	  };

type QueryResult<T> = {
	time: Date;
	uuid: string;
	username: string;
	value: T;
};

type LeaderboardTypePlayer = LeaderboardType & {
	category: "player";
};

export const getStatAtTime = async <T>(
	query: PlayerQuery,
	stat: LeaderboardTypePlayer,
	time: Date,
): Promise<QueryResult<T> | undefined> => {
	const queryFilter: SQL =
		"username" in query
			? eq(
					sql<string>`lower(${users.username})`,
					query.username.toLocaleLowerCase(),
				)
			: eq(sql<string>`lower(${users.uuid})`, query.uuid.toLocaleLowerCase());

	if (stat.type === "path") {
		const [data, ..._] = await db
			.select({
				time: users.time,
				uuid: users.uuid,
				username: users.username,
				value: sql<T>`json_extract(${users.data}, ${`$.${stat.path}`})`,
			})
			.from(users)
			.where(and(queryFilter, gte(users.time, time)))
			.orderBy(asc(users.time))
			.limit(1);

		return data;
	}

	const [data, ..._] = await db
		.select({
			time: users.time,
			uuid: users.uuid,
			username: users.username,
			data: users.data,
		})
		.from(users)
		.where(and(queryFilter, gte(users.time, time)))
		.orderBy(asc(users.time))
		.limit(1);

	if (!data) return;
	const value = stat.getValue(data.data);

	return {
		time: data.time,
		uuid: data.uuid,
		username: data.username,
		value: value as T,
	};
};

export const getStatNow = async <T>(
	query: PlayerQuery,
	stat: LeaderboardTypePlayer,
): Promise<QueryResult<T> | undefined> => {
	const queryFilter: SQL =
		"username" in query
			? eq(
					sql<string>`lower(${users.username})`,
					query.username.toLocaleLowerCase(),
				)
			: eq(sql<string>`lower(${users.uuid})`, query.uuid.toLocaleLowerCase());

	if (stat.type === "path") {
		const [data, ..._] = await db
			.select({
				time: users.time,
				uuid: users.uuid,
				username: users.username,
				value: sql<T>`json_extract(${users.data}, ${`$.${stat.path}`})`,
			})
			.from(users)
			.where(and(queryFilter))
			.orderBy(desc(users.time))
			.limit(1);

		return data;
	}

	const [data, ..._] = await db
		.select({
			time: users.time,
			uuid: users.uuid,
			username: users.username,
			data: users.data,
		})
		.from(users)
		.where(and(queryFilter))
		.orderBy(desc(users.time))
		.limit(1);

	if (!data) return;
	const value = stat.getValue(data.data);

	return {
		time: data.time,
		uuid: data.uuid,
		username: data.username,
		value: value as T,
	};
};

/*
1527735609891 -> 332
1627735609891 -> 476
1727735609891 -> 526
*/

export const getTopGainsWithin = async <T>(
	stat: LeaderboardTypePlayer,
	time: Date,
) => {
	let currentValues = [];

	if (stat.type === "path") {
		const allPlayersNow = await db
			.select({
				uuid: users.uuid,
				username: users.username,
				time: users.time,
				value: sql<T>`json_extract(${users.data}, ${`$.${stat.path}`})`,
			})
			.from(users)
			.groupBy(({ uuid }) => uuid)
			.orderBy(({ time }) => max(time));

		currentValues = allPlayersNow;
	} else {
		const allPlayersNow = await db
			.select({
				uuid: users.uuid,
				username: users.username,
				time: users.time,
				id: users.id,
				data: users.data,
			})
			.from(users)
			.groupBy(({ uuid }) => uuid)
			.orderBy(({ time }) => max(time));

		currentValues = allPlayersNow.map((player) => {
			const value = stat.getValue(player.data) || 0;
			return {
				username: player.username,
				uuid: player.uuid,
				value,
				time: player.time,
			};
		});
	}

	let oldValues = [];

	if (stat.type === "path") {
		const allPlayersThen = await db
			.select({
				uuid: users.uuid,
				username: users.username,
				time: users.time,
				value: sql<T>`json_extract(${users.data}, ${`$.${stat.path}`})`,
			})
			.from(users)
			.where(gte(users.time, time))
			.groupBy(({ uuid }) => uuid)
			.orderBy(({ time }) => min(time));

		oldValues = allPlayersThen;
	} else {
		const allPlayersThen = await db
			.select({
				uuid: users.uuid,
				username: users.username,
				time: users.time,
				data: users.data,
			})
			.from(users)
			.where(gte(users.time, time))
			.groupBy(({ uuid }) => uuid)
			.orderBy(({ time }) => min(time));

		oldValues = allPlayersThen.map((player) => {
			const value = stat.getValue(player.data) || 0;
			return {
				username: player.username,
				uuid: player.uuid,
				value,
				time: player.time,
			};
		});
	}

	return {
		gainData: currentValues
			.map((player) => {
				const thenPlayer = oldValues.find((p) => p.uuid === player.uuid);
				if (!thenPlayer) {
					return {
						username: player.username,
						uuid: player.uuid,
						gain: 0,
						time: player.time,
						oldStat: 0,
						newStat: player.value,
					};
				}
				return {
					username: player.username,
					uuid: player.uuid,
					gain: Number(player.value) || 0 - (Number(thenPlayer.value) || 0),
					time: thenPlayer.time,
					oldStat: thenPlayer.value,
					newStat: player.value,
				};
			})
			.filter((data) => data.gain > 0)
			.sort((a, b) => b.gain - a.gain),
		total: currentValues.length,
	};
};

export const saveData = async ({
	username,
	uuid,
	data,
}: { username: string; uuid: string; data: PlayerProfile }): Promise<void> => {
	db.insert(users).values({ username, uuid, time: new Date(), data }).run();
};

export { db };
