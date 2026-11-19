# Frontend roles (demo shell)

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Demo auth is a two-step gate: **choose a venture → sign in as a role → stay locked**. The only identity that can browse every venture is **Stemworks app ownership**.

Real auth (JWT, refresh cookies, RLS) remains the architecture target in [security.md](security.md). Until that lands, the shell uses `stemworks_session` (legacy `stemworks_role` kept in sync).

## Login flow

1. Open `/` while signed out.
2. Select a venture (Luminary, Jade, or Pampered Soul).
3. Select a role (owner / employee / customer / vendor) and enter.
4. You are **locked** to that venture + role until **Sign out**.
5. Or choose **Enter as Stemworks app owner** to view every desk and board.

Public surfaces stay open without login: `/book`, `/e/{slug}`.

## Session shape

```json
{
  "signedIn": true,
  "appOwner": false,
  "activeVenture": "pampered_soul",
  "role": "employee"
}
```

| Field | Meaning |
| --- | --- |
| `signedIn` | Cookie is an active demo login |
| `appOwner` | Stemworks app ownership — can open every venture |
| `activeVenture` | Locked venture (or the venture the app owner is viewing) |
| `role` | Venture role; app owners always act as `owner` while browsing |

## Roles (within one locked venture)

| UI role | Home | Sees |
| --- | --- | --- |
| Owner | `/dashboard?tenant=…` | That venture’s command board + desk |
| Employee | Venture desk | Floor ops for that venture only |
| Customer | `/portal?venture=…` | That venture’s guest/shopper portal |
| Vendor | `/vendor?venture=…` | That venture’s partner desk |

## App ownership

- Persona: **Stemworks Owner**
- Home: `/` multi-desk hub
- Can switch the active venture and open any desk/board
- Does **not** replace per-venture owners; those remain locked when entered via normal login

## Rules

- Middleware sends unsigned users to `/` (except public guest paths).
- Locked users hitting `/` are sent to their role home.
- Locked users cannot switch venture without signing out.
- Hiding a nav item is not authorization — API handlers must still enforce roles when auth ships.

## Code

- Venture map: `apps/web/lib/auth/ventures.ts`
- Role map: `apps/web/lib/auth/roles.ts`
- Cookie session: `apps/web/lib/auth/session.ts`
- Auth API: `POST /api/v1/session/role` with `action`: `login` | `login_app_owner` | `switch_venture` | `logout`
- Login UI: `apps/web/components/shell/login-gate.tsx`
- Shell panel: `apps/web/components/shell/session-panel.tsx`
