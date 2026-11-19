# Supabase

Stemworks is wired to a Supabase project so the repo can connect through Supabase GitHub Integration. Local desks still use SQLite until a Postgres cutover; this document covers project identity, runtime clients, and dashboard connection.

## Project

| Field | Value |
| --- | --- |
| Name | `stemworks-dev` |
| Dashboard | https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib |
| Project ref | `kcskzamqbpzxlfpqisib` |
| API URL | https://kcskzamqbpzxlfpqisib.supabase.co |
| GitHub repo | [noleysc/stemworks-arch-seniorProject](https://github.com/noleysc/stemworks-arch-seniorProject) |
| Working directory | `.` |

CLI config lives in [`supabase/config.toml`](../../supabase/config.toml) with `project_id = "stemworks"`. Env placeholders are in [`apps/web/.env.example`](../../apps/web/.env.example). Do not commit real passwords or service-role keys.

## Runtime clients

- **Keys:** put `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (server-only) `SUPABASE_SERVICE_ROLE_KEY` in `apps/web/.env.local` (gitignored). Never commit real keys.
- **Clients:** browser and server helpers live in [`apps/web/lib/supabase/`](../../apps/web/lib/supabase/) (`env.ts`, `client.ts`, `server.ts`).
- **Health:** `GET /api/v1/supabase/health` checks that `NEXT_PUBLIC_SUPABASE_*` is configured, then probes `${url}/auth/v1/health` with the anon key. Response shape: `{ ok, project, url, auth, detail }`.

## Connect GitHub Integration

1. Open the [project dashboard](https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib).
2. Go to **Project Settings → Integrations**.
3. Choose **Authorize GitHub** (or connect GitHub if not already linked).
4. Select the repo **noleysc/stemworks-arch-seniorProject**.
5. Set the working directory to `.` (repo root, where `supabase/` lives).
6. Save / confirm the integration.

A personal access token can link the Supabase CLI to this project. GitHub Integration still needs dashboard authorize unless the token has org integration scopes.

## Cursor MCP

Cursor MCP for this project is configured in [`.cursor/mcp.json`](../../.cursor/mcp.json), pointing at:

`https://mcp.supabase.com/mcp?project_ref=kcskzamqbpzxlfpqisib`
