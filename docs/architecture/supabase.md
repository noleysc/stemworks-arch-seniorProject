# Supabase

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Managed Postgres for Stemworks. Architecture already allows Supabase as the hosted database ([README.md](README.md)).

## Project

| Field | Value |
| --- | --- |
| Dashboard | https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib |
| Project ref | `kcskzamqbpzxlfpqisib` |
| API URL | `https://kcskzamqbpzxlfpqisib.supabase.co` |
| GitHub repo to connect | `noleysc/stemworks-arch-seniorProject` |
| Working directory | `.` (`supabase/` at repo root) |

Local desks still default to SQLite (`apps/web/prisma`). Point `DATABASE_URL` at the Supabase Session pooler when the Postgres cutover starts. Prisma stays the write path until auth and RLS ship.

## Connect this repo in the Supabase dashboard

The agent cannot complete GitHub OAuth for you. Do this once in the browser:

1. Open [Project Settings → Integrations](https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib/settings/integrations).
2. Under **GitHub Integration**, click **Authorize GitHub**.
3. Authorize the Supabase GitHub App as `noleysc`.
4. Choose repository **`noleysc/stemworks-arch-seniorProject`**.
5. Set **Working directory** to `.`
6. Enable the integration (and Automatic branching only if you want preview DBs).

After that, pushes that change files under `supabase/` apply through the GitHub integration.

## Cursor MCP (optional)

`.cursor/mcp.json` points at this project. In Cursor: **Settings → Tools & MCP → supabase → Connect**, then approve the org that owns `kcskzamqbpzxlfpqisib`.
