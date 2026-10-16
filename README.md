# Stemworks

Architecture for the Stemworks operating system. Stemworks is owned by Diaz Ventures LLC and runs that company's ventures: Jade Flowers, Jade Experiences, Jade Haven, and Stemworks itself as a product in validation. The same kernel is what later tenants will run, under row-level isolation from the first migration.

This repository is the architecture. It does not yet contain the web app, the API, or the database.

## Read this

Start with [docs/architecture/README.md](docs/architecture/README.md). It is the map: what must stay a separate module, how the process is shaped, and what is built first.

| Document | What it settles |
| --- | --- |
| [docs/architecture/README.md](docs/architecture/README.md) | Boundaries, shape, phase gates |
| [docs/architecture/modules.md](docs/architecture/modules.md) | Aggregates, ports, which venture enables which module |
| [docs/architecture/security.md](docs/architecture/security.md) | Authentication, row-level security, ledger, secrets, CI |
| [docs/architecture/dashboard.md](docs/architecture/dashboard.md) | The four zones and where Phase 1 numbers come from |
| [docs/architecture/spec-gaps.md](docs/architecture/spec-gaps.md) | Spec omissions and the decision recorded for each |

The sources reconciled here are the Technical Specification v1.0 (April 2026), the Dashboard Specification, and the Native Module Client Definitions. Where those documents disagree on calendar phase, the architecture isolates the module and does not invent a schedule.

## Run

There is no server to start. Implementation follows the phase gates in the architecture overview: kernel and row-level security, owner authentication, the Jade Flowers product and Candle Atelier modules, and the dashboard read model. Event Production, Hospitality Pipeline, integration adapters, and the predictive layer are specified and are not part of that first build.

Copyright Diaz Ventures LLC. All rights reserved. See [LICENSE](LICENSE).
