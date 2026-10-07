import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import icon from "astro-iconset";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { postgres, sqlite } from "emdash/db";
import { supabaseConnectionString } from "./src/db/supabase-url.ts";

const databaseUrl = supabaseConnectionString();
const blobStorageEntry = fileURLToPath(
	new URL("./src/storage/vercel-blob.ts", import.meta.url),
).replaceAll("\\", "/");

export default defineConfig({
	output: "server",
	adapter: vercel(),
	session: {
		driver: {
			entrypoint: new URL("./src/session/postgres-driver.ts", import.meta.url),
		},
	},
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		icon({
			// Only ship the Phosphor icons actually referenced in templates,
			// not the full @iconify-json/ph set.
			include: {
				ph: [
					"chart-bar",
					"check-circle",
					"clock",
					"cloud",
					"code",
					"currency-dollar",
					"envelope",
					"globe",
					"heart",
					"lifebuoy",
					"lightning",
					"lock",
					"shield-check",
					"sparkle",
					"star",
					"users-three",
				],
			},
		}),
		emdash({
			database: databaseUrl
				? postgres({
						connectionString: databaseUrl,
						pool: { min: 0, max: 1 },
						migrationConnectionStringEnv: "POSTGRES_URL_NON_POOLING",
					})
				: sqlite({ url: "file:./data.db" }),
			storage: {
				entrypoint: blobStorageEntry,
				config: {},
			},
			// Bearer auth uses EMDASH_MCP_TOKEN from .env. See .cursor/mcp.json.
			mcp: true,
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700, 800],
			fallbacks: ["sans-serif"],
		},
	],
	devToolbar: { enabled: false },
});
