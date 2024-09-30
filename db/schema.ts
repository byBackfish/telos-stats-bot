import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { type PlayerProfile } from "../src/api/struct/player";

export const users = sqliteTable('users', {
    id: integer("id", { mode: 'number' }).primaryKey({autoIncrement: true}).notNull(),
    uuid: text("uuid").notNull(),
    username: text("username").notNull(),
    time: integer('time', { mode: 'timestamp_ms' }).notNull().defaultNow(),
    data: text("data", { mode: 'json' }).$type<PlayerProfile>().notNull(),
})
