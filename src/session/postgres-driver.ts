import { DatabaseSync } from "node:sqlite";
import type { SessionDriver } from "astro";
import { Pool } from "pg";

const strip = (value: string | undefined) => value?.replace(/^"|"$/g, "");

let pool: Pool | undefined;
let postgresReady: Promise<unknown> | undefined;
let sqlite: DatabaseSync | undefined;

async function postgresDatabase(connectionString: string): Promise<Pool> {
	if (!pool) {
		pool = new Pool({
			connectionString,
			min: 0,
			max: 1,
		});
		postgresReady = pool.query(
			"CREATE TABLE IF NOT EXISTS _astro_sessions (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at BIGINT NOT NULL)",
		);
	}
	await postgresReady;
	return pool;
}

function sqliteDatabase(): DatabaseSync {
	if (!sqlite) {
		sqlite = new DatabaseSync("./data.db");
		sqlite.exec("PRAGMA journal_mode = WAL");
		sqlite.exec("PRAGMA busy_timeout = 5000");
		sqlite.exec(
			"CREATE TABLE IF NOT EXISTS _astro_sessions (id TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL)",
		);
	}
	return sqlite;
}

/**
 * Astro session driver backed by Supabase Postgres in production and the
 * local SQLite database during development.
 */
export default function postgresSessionDriver(): SessionDriver {
	return {
		async getItem(key) {
			const connectionString = strip(process.env.DATABASE_URL);
			if (connectionString) {
				const db = await postgresDatabase(connectionString);
				const result = await db.query<{ value: string }>(
					"SELECT value FROM _astro_sessions WHERE id = $1",
					[key],
				);
				return result.rows[0]?.value ?? null;
			}

			const row = sqliteDatabase()
				.prepare("SELECT value FROM _astro_sessions WHERE id = ?")
				.get(key) as { value: string } | undefined;
			return row?.value ?? null;
		},
		async setItem(key, value) {
			const serialized = typeof value === "string" ? value : JSON.stringify(value);
			const connectionString = strip(process.env.DATABASE_URL);
			if (connectionString) {
				const db = await postgresDatabase(connectionString);
				await db.query(
					"INSERT INTO _astro_sessions (id, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at",
					[key, serialized, Date.now()],
				);
				return;
			}

			sqliteDatabase()
				.prepare(
					"INSERT INTO _astro_sessions (id, value, updated_at) VALUES (?, ?, ?) ON CONFLICT (id) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
				)
				.run(key, serialized, Date.now());
		},
		async removeItem(key) {
			const connectionString = strip(process.env.DATABASE_URL);
			if (connectionString) {
				const db = await postgresDatabase(connectionString);
				await db.query("DELETE FROM _astro_sessions WHERE id = $1", [key]);
				return;
			}

			sqliteDatabase().prepare("DELETE FROM _astro_sessions WHERE id = ?").run(key);
		},
	};
}
