# Jade Flowers — product slice

Confidential. Diaz Ventures LLC · Stemworks LLC · 2026.

Jade Flowers is a venture on the **Diaz Ventures LLC** tenant (`tenant.key = diaz_ventures`). It is not a Luminary subsidiary. Confirmed and Potential from Jade Flowers never sum into the Luminary board.

## What this slice is

The running desk under `/jade` is the first `product` module slice:

- Materials catalog, purchase receipts, append-only inventory movements, on-hand balance
- SKUs with retail, wholesale, and event prices in integer cents
- Orders with `JF-ORD-{year}-{seq}` codes and channel/status rules from [modules.md](modules.md)
- Reorder alerts when on-hand is at or below `reorderPoint`

The Stemworks dashboard composes this venture through the product port:

`GET /api/v1/dashboard?tenant=diaz_ventures`

## What this slice is not

- Batches, FIFO consumption into pours, QC release, and SKU lineage (next product slice)
- Candle Atelier sessions (`atelier` module)
- Craftybase, Square, or Shopify adapters
- Login and Postgres RLS (same gate as the Luminary desk)

## Tenant boundary

| Tenant | Ventures on the board |
| --- | --- |
| `luminary` | Rooms, Dining, Gatherings (`hotel` ports) |
| `diaz_ventures` | Jade Flowers (`product`), plus quiet placeholders for Experiences, Haven, Stemworks |

Adding another venture is a registry entry plus a port. The dashboard composer does not hardcode Luminary cards.
