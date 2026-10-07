# Centeno-Schultz Clinic

EmDash site for the Centeno-Schultz Clinic. Astro renders the clinic header, footer, and landing page. Content lives in the database. The deployed site is [https://centeno-schultz-clinic-staging.vercel.app/](https://centeno-schultz-clinic-staging.vercel.app/).

Package manager is bun.

## Local

```bash
bun install
cp .env.example .env
bun dev
```

Open [http://localhost:4321](http://localhost:4321). The admin is [http://localhost:4321/_emdash/admin](http://localhost:4321/_emdash/admin).

Leave `POSTGRES_URL_NON_POOLING` empty in `.env`. The app then uses SQLite at `file:./data.db`. On a new database, EmDash applies `seed/seed.json` once, before the setup wizard finishes. After that, change collections with the admin or the app MCP. `bunx emdash seed` only writes the local SQLite file.

Generate a unique `EMDASH_ENCRYPTION_KEY` for this machine. Set `EMDASH_MCP_TOKEN` to a personal access token from the local admin if you want the project EmDash MCP in `.cursor/mcp.json` (`http://localhost:4321/_emdash/api/mcp`).

## Vercel

Production uses the Vercel project `centeno-schultz-clinic-staging` and Supabase.

1. Install the [Vercel CLI](https://vercel.com/docs/cli) and log in: `vercel login`.
2. Connect the Vercel MCP in Cursor so deploys and logs can be read without the dashboard.
3. The Supabase integration must set `POSTGRES_URL_NON_POOLING` on **Production**. That is the session pooler (port 5432). Do not point the app at `POSTGRES_URL` (transaction pooler, port 6543). The app rewrites `sslmode` to `no-verify` because Node rejects the pooler certificate chain.
4. Connect a Vercel Blob store so `BLOB_STORE_ID` is present. Uploads need it.
5. Set `EMDASH_ENCRYPTION_KEY` on Production. Use a different value from local.
6. Push to `main`. Vercel builds Production from that branch.

Preview and Development do not have the Supabase connection variables. Schema and content changes for the live staging site go to Production only.

`seed/seed.json` does not run again after setup. A deploy does not create collections. Core migrations run on request and do not add collections either. Add or change collections on the live database with the app MCP (`schema_create_collection`, `schema_create_field`, `schema_update_collection`), then publish entries with `content_create` and `content_publish`.

Use the app MCP for the deployed site, aimed at `https://centeno-schultz-clinic-staging.vercel.app/_emdash/api/mcp`. Create the bearer token in the staging admin.

## Copy from the live clinic site

Page copy, menus, and media that should match [https://centenoschultz.com/](https://centenoschultz.com/) come from the WordPress MCP server and the Emdash-Exporter plugin.

## Optional: Graft

[Graft](https://github.com/nanonets/graft) is already listed in `.cursor/mcp.json` as the `graft` server (`npx -y @nanonets/graft mcp`). The repo index is `graft/`. It answers “where does this live?” from small linked notes instead of reading whole files, which uses fewer tokens.

It is optional. When an agent is about to use it, it should ask first. If you say yes, `graft ask`, `graft skeleton`, and `graft callers` are the usual commands. After a large code change, `graft build` refreshes the index with no API key.

## MCP servers

| Server | Role |
|---|---|
| `emdash` in `.cursor/mcp.json` | Local app MCP at `http://localhost:4321/_emdash/api/mcp` |
| emdash mcp | Deployed app MCP. Schema and published entries on staging |
| `emdash-docs` | [EmDash docs](https://docs.emdashcms.com/mcp) |
| Vercel MCP and `vercel` CLI | Deployments, env, and logs for Production |
| WordPress MCP server | Live content on [centenoschultz.com](https://centenoschultz.com/) |
| `graft` | Optional. |
