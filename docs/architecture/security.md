# Security

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Controls that ship with the kernel, before any second user and before any integration. The technical spec makes these non-negotiable from the first day. This document is the implementation spec. Module behavior that depends on them is in [modules.md](modules.md). Gaps between the spec's wording and these controls are listed in [spec-gaps.md](spec-gaps.md).

## Request path

Every authenticated call does the following, in order, inside one database transaction. If a step fails, the transaction rolls back and the client gets a generic error.

1. Rate limit. Auth routes and any route that writes money or inventory are limited per IP and per account.
2. Authenticate. Read the access token from the `Authorization: Bearer` header. Reject missing, expired, or badly signed tokens with 401. Public routes are only `POST /api/v1/auth/login` and `POST /api/v1/auth/refresh`.
3. Load the user by `sub` and reject the request with 401 when `is_active` is false. Deactivation works on the next request. It does not wait for the access token to expire.
4. Open the transaction and set the tenant context with `set_config(..., true)`, so the setting is local to the transaction and dies at commit. Then authorize the action against the role snapshot and the route's required permission.
5. If the route names a `subsidiary_id`, it must be in the caller's allowed set. A miss is 404, so the response does not confirm that the other venture exists.
6. Validate the body and query. Reject unknown fields.
7. For the three idempotent creates, claim the idempotency key.
8. Call one module service. The service writes audit rows in the same transaction when the mutation is audited.
9. Commit. The response is JSON. Money is cents. Timestamps are ISO 8601 UTC.

A handler that forgets the tenant setting fails closed. Middleware treats a missing setting as a programming error and returns 500. Row-level security also returns no rows when the setting is absent. An empty list is never the signal that the tenant context was skipped. Those are two different failures, and both deny data.

## Authentication

Passwords are hashed with bcrypt, cost factor 12. The hash column is excluded from every query the API uses to build a response. Login compares the hash and, on success, updates `last_login_at` and writes an audit row. Failure returns the same 401 body as an unknown email, and does not say which of the two was wrong.

Access token:

- Signed JWT, lifetime 15 minutes.
- Claims: `sub` (user id), `tenant_id`, `roles` (the snapshot: `{ subsidiary_id, role }[]`), `iat`, `exp`, `jti`.
- No email, name, or permission prose beyond the role enum.
- The snapshot can be up to 15 minutes old. Changing a role revokes that user's refresh tokens, so the next refresh loads the new snapshot. Combined with the `is_active` check, a disabled account stops immediately and a demotion stops within one access-token lifetime.

Refresh token:

- 32 bytes from a cryptographic random source, returned to the browser only as a cookie: `HttpOnly`, `Secure`, `SameSite=Strict`, path scoped to `/api/v1/auth`.
- The database stores a hash of the token, not the token. Columns: `id`, `tenant_id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `replaced_by`, `created_at`.
- Lifetime 7 days. Each refresh revokes the presented token and inserts a new one (`replaced_by`). Reuse of a revoked token revokes the whole chain for that user and writes an audit row. That is the detection path for a stolen refresh token.
- `POST /auth/logout` revokes the presented refresh token and clears the cookie. `POST /auth/refresh` requires the cookie. It does not accept the refresh token in JSON.
- Login returns the access token in the JSON body and sets the cookie. The JSON body does not contain the refresh token.

`GET /auth/me` returns the profile and the role assignments. It does not return `password_hash` or session material.

Transport is HTTPS only. HTTP is redirected. Cookies are not set on an insecure origin. Local development uses a documented exception for `Secure` only when the host is localhost, and that exception is off in any deployed environment.

## Authorization

The role check lives on the server. The web app may hide a control. That hiding is not the control.

A user has exactly one role per subsidiary and may have different roles in different subsidiaries. The owner role is one row for the tenant, with `subsidiary_id` null. There is one owner per tenant.

| Action | Owner | Manager | Associate | Client | Platform admin |
| --- | --- | --- | --- | --- | --- |
| Batch create | Yes | Yes | Yes | No | No |
| Batch edit, including QC and status | Yes | Yes | No | No | No |
| Inventory view | Yes | Yes | Yes | No | No |
| Inventory edit, purchases | Yes | Yes | No | No | No |
| COGS, margin, batch financials | Yes | Own subsidiary | No | No | No |
| Subsidiary P&L and channel breakdown | Yes | Own subsidiary | No | No | No |
| Consolidated parent P&L | Yes | No | No | No | No |
| Orders | Yes | Yes | Assigned orders, operational fields only | No | No |
| Events, view | Yes | Yes | Yes | No | No |
| Events, costs and P&L | Yes | Yes | No | No | No |
| Event check-in | Yes | Yes | Yes | No | No |
| Settings and user management | Yes | No | No | No | No |
| Tenant health counts | Yes | No | No | No | Yes, health view only |
| Another subsidiary's rows | Yes, inside the tenant | No | No | No | No |
| Another tenant's rows | No | No | No | No | No |

Field rules that the matrix implies and the route must enforce:

- Associate `PATCH /batches/:id` is 403. Create is allowed. The create response omits cost snapshots.
- Associate responses omit every `*_cents` cost, margin, and profit field, and omit financial endpoints entirely with 403.
- Associate order access requires `attributed_to` equal to that user. They may set operational status and the ship and delivery timestamps. They may not change amounts, discounts, or COGS. COGS is server-filled in any case.
- Associate event access may set a registration to `attended` or `no_show` and may set `checked_in_at`. Cost buckets, net profit, and break-even are stripped from the payload.
- Manager queries carry a subsidiary constraint. A consolidated route is 403. A path that names another subsidiary is 404.
- Client is 403 on every first-build route.
- Platform admin is rejected by every operational router. The health route, when it exists, uses a different database role and a view that exposes tenant id, plan tier, active flag, and created time. It does not join operational tables. That route is not part of the first build. The namespace is reserved so nobody adds it as a flag on the operational handlers.

Permission checks use an explicit map from route to permission. There is no default-allow.

## Row-level security

PostgreSQL is the primary isolation control. Application filters are the backup.

Three roles:

| Role | Used by | Privileges |
| --- | --- | --- |
| `stemworks_migrator` | Migrations only | Owns the tables. Not used by the running API. |
| `stemworks_app` | The API, every request | `NOBYPASSRLS`. DML on tenant tables. Subject to policies. |
| `stemworks_platform` | Reserved for the health view | `SELECT` on `platform.tenant_health` only. No grant on operational tables. |

Table owners bypass row-level security unless it is forced. Every tenant-owned table is created with `ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY`. The app role is not a superuser and not the owner. Using the migrator role as the application's connection would silently turn the policies off. The API process refuses to start when its database user is `stemworks_migrator` or a superuser.

Context is set inside the transaction, never at session level:

```sql
SELECT set_config('app.tenant_id', $tenant, true);
SELECT set_config('app.tenant_wide', $is_owner, true);
SELECT set_config('app.subsidiary_ids', $csv_of_uuids, true);
```

The third argument `true` makes the setting local to the transaction. Pooled connections therefore cannot leak the previous tenant. A helper used by policies:

```sql
CREATE FUNCTION app.current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;
```

Policy shape, on every tenant-owned table:

```sql
CREATE POLICY tenant_isolation ON batches
  USING (tenant_id = app.current_tenant())
  WITH CHECK (tenant_id = app.current_tenant());
```

Subsidiary-scoped roles add a second predicate: `subsidiary_id` is in the set passed for this transaction, or the row's subsidiary is reached through its parent when the table has no `subsidiary_id` of its own. Owner transactions set `app.tenant_wide` and skip that predicate. They still cannot see another tenant, because `tenant_id` remains required.

`WITH CHECK` on insert and update stops a bug from writing a row into another tenant. Child tables carry their own `tenant_id` so the policy does not depend on a join the planner could get wrong.

Platform-admin sessions do not set `app.tenant_id` to a customer's tenant. With the setting unset, `app.current_tenant()` is null and operational policies match nothing. The health view is granted to `stemworks_platform` only.

Indexes that match the policies: (`tenant_id`) and, where the table has it, (`tenant_id`, `subsidiary_id`).

## Money and the inventory ledger

Every money column is `integer` cents and named `*_cents`. Inputs that arrive as decimal currency are rejected. Division uses PostgreSQL `numeric` and `ROUND`, which is half away from zero, and the result is stored as `integer`. Floats are not used in money arithmetic in application code either.

Snapshots:

- `batch_materials.cost_per_unit_cents` and `total_cost_cents` are the FIFO cost of the lots consumed at batch time. Later purchase prices do not change them.
- `sku_batch_lineage.cogs_per_unit_cents` is the batch cost divided by units that passed QC, taken at release.
- `order_line_items.cogs_per_unit_cents` is the blend of the lineage units allocated at sale time.
- Event `net_profit_cents` is computed at completion from stored revenue and the three cost buckets.

The client never supplies a COGS figure. The server writes it.

Inventory:

- `inventory_movements` is append-only. The application role has `INSERT` and `SELECT` on it, not `UPDATE` or `DELETE`.
- `inventory_levels.quantity_on_hand` is updated in the same transaction as the movement, by the same service, under `SELECT … FOR UPDATE` on the balance row.
- A batch create that would drive any material below zero rolls back.
- Finished goods follow the same pattern: QC release and order allocation are movements, and `units_on_hand` and `units_allocated` move with them.
- Units available to sell are computed as on-hand minus allocated.

Financial rows (`material_purchases`, `batch_materials`, `orders`, `order_line_items`, ledger rows, registration deposits) are not hard-deleted. Corrections are new rows: a refunded order, a reversing movement, a cancelled registration.

## Secrets

Integration credentials are encrypted with AES-GCM before they are stored in `branch_secrets`. The data key lives in the environment, not in the database and not in the repository. Ciphertext, nonce, and key version are the stored columns. Logs, traces, and `last_error` must not contain the secret, the authorization header, or the remote response body.

Disconnect deletes the secret row. It does not blank it in place and leave the ciphertext.

Source files carry this header:

```text
Copyright (c) 2026 Diaz Ventures LLC. All rights reserved.
Confidential and proprietary. No license is granted to use, copy,
modify, or distribute this file except under a written agreement
with Diaz Ventures LLC.
```

The product is not published under an open-source license. The repository is private and owned by a Diaz Ventures LLC account. Dependency licenses are reviewed so a copyleft obligation is not pulled into the proprietary tree by accident.

## Logging, audit, and personal data

Application logs: request id, tenant id, user id, route, status, duration. They do not contain email, phone, full name, password, token, cookie, or request bodies of auth and customer routes.

`audit_events` is append-only (`INSERT` and `SELECT` for the app role). Each row: `id`, `tenant_id`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `at`, and a JSON payload that has already been stripped of personal data and secrets. Recorded actions: login success, login failure (no identifier beyond a hash of the attempted email if one is needed for rate limiting), logout, refresh reuse, role assignment, user deactivation, batch create and status change, purchase receipt, inventory movement, order money change, registration deposit, branch secret write and delete.

Backups run daily and are retained at least 30 days. Restore is tested against a copy, not against production. Backup storage is encrypted by the provider and is not world-readable.

Email and phone are stored in the clear during the first build, matching the spec, which defers encryption at rest of those fields until Haven client data exists. They are still excluded from logs. Health, diagnosis, and wellness-program clinical fields are not collected. If that data is later required, it lives in a classified store with its own role, its own encryption, and its own audit, and the decision waits on counsel.

## Errors and abuse

- 401 unauthenticated, 403 authenticated but not allowed, 404 when a venture or a record is outside scope (so existence is not leaked across subsidiaries).
- Validation errors name the field. They do not echo the database.
- SQL text, stack traces, and token contents stay in server logs, and even there the token is redacted.
- Cursor pagination only. Offset pagination on tenant tables is not added.
- Idempotency on the three creates that move inventory or record a deposit. Same key, same body: the stored response. Same key, different body: 409.
- Auth endpoints are rate limited tightly enough that online password guessing is not practical, on top of bcrypt's cost.

## Continuous integration

A migration fails the build when any of these are true:

- A new table in the tenant schema has no `tenant_id` column.
- A new tenant table has no `ENABLE` and `FORCE ROW LEVEL SECURITY`, or no policy that predicates on `app.current_tenant()`.
- The application connection string uses a superuser or `stemworks_migrator`.
- A money column is not `integer`, or a money column's name does not end in `_cents`.
- `inventory_movements` is granted `UPDATE` or `DELETE` to `stemworks_app`.
- A source file under `apps/` or `packages/` is missing the proprietary header.

Tests that must exist before a second role is handed to a person, and that the first build already runs against the owner:

- A request with tenant A's token cannot read or write tenant B's batch, material, order, or event. Asserted at the database, with the app role, not only through the HTTP filter.
- A manager token for subsidiary 1 receives 404 for subsidiary 2.
- An associate token receives 403 on `GET /financials/pl`, `GET /batches/:id/financials`, and `PATCH /batches/:id`.
- A deactivated user with a still-unexpired access token receives 401.
- Logout and then refresh receives 401.
- Presenting a rotated refresh token revokes the chain.
- Two concurrent batch creates do not consume the same unit of stock and do not take the same batch code.
- Replaying a batch create with the same idempotency key does not insert a second movement.
- The status payload for a branch contains no secret field.

## What this document defers

Multi-user invites, the platform admin UI, field-level encryption of email and phone, the classified health store, and adapter credential rotation beyond `key_version` are specified as constraints above and are not part of the first build. The constraints are there so those later pieces do not require a different isolation model.
