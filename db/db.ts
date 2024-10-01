// import { createClient } from '@libsql/client';
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";

// const client = createClient({ url: process.env.DB_URL as string, authToken: process.env.DB_AUTH_TOKEN });
const client = new Database("users.db");

export const db = drizzle(client);
