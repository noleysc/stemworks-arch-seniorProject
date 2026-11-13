# Supabase

Stemworks is wired to a Supabase project so the repo can connect through Supabase GitHub Integration. Local desks still use SQLite until a Postgres cutover; this document covers project identity and dashboard connection only.

## Project

| Field | Value |
| --- | --- |
| Dashboard | https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib |
| Project ref | `kcskzamqbpzxlfpqisib` |
| API URL | https://kcskzamqbpzxlfpqisib.supabase.co |
| GitHub repo | [noleysc/stemworks-arch-seniorProject](https://github.com/noleysc/stemworks-arch-seniorProject) |
| Working directory | `.` |

CLI config lives in [`supabase/config.toml`](../../supabase/config.toml) with `project_id = "stemworks"`. Env placeholders are in [`apps/web/.env.example`](../../apps/web/.env.example). Do not commit real passwords or service-role keys.

## Connect GitHub Integration

1. Open the [project dashboard](https://supabase.com/dashboard/project/kcskzamqbpzxlfpqisib).
2. Go to **Project Settings → Integrations**.
3. Choose **Authorize GitHub** (or connect GitHub if not already linked).
4. Select the repo **noleysc/stemworks-arch-seniorProject**.
5. Set the working directory to `.` (repo root, where `supabase/` lives).
6. Save / confirm the integration.

## Cursor MCP

Cursor MCP for this project is configured in [`.cursor/mcp.json`](../../.cursor/mcp.json), pointing at:

`https://mcp.supabase.com/mcp?project_ref=kcskzamqbpzxlfpqisib`
