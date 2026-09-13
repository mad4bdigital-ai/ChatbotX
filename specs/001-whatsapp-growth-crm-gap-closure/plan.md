# Implementation Plan

## Technical context

- Node.js 24, TypeScript 5, pnpm 10, Turborepo.
- Next.js/React builder, worker services, PostgreSQL/Drizzle, Redis/BullMQ.
- Primary areas: `packages/database`, `packages/business`, `packages/flow-config`, `packages/sequence-scheduler`, `apps/worker`, `apps/builder`, `integrations/whatsapp`, public API/docs.

## Constitution checks

- Official Cloud API only: PASS by design.
- Channel/purpose consent: new centralized model/gate required.
- Attribution provenance: extend existing CTWA/CAPI implementation, do not replace.
- Durable automation: use persisted state + existing queues.
- Tenant isolation: workspace-scoped schema/tests mandatory.
- Enterprise boundary: no changes under `apps/builder/src/enterprise` for feature completion.

## Phase 0 — Baseline contracts and characterization tests

1. Freeze exact upstream behavior around sequence enrollment/unsubscribe, broadcast subscription, WhatsApp template sending, CTWA ingestion and CAPI delivery.
2. Add characterization tests before modifying behavior.
3. Map all current send entry points to ensure the future consent gate cannot be bypassed.

## Phase 1 — Consent registry and send-policy gate (P0)

- Add DB migration/models/services.
- Add immutable consent event log.
- Add API + flow actions + agent UI controls.
- Add configurable WhatsApp opt-out/opt-in keyword recognition.
- Introduce policy service and route marketing broadcast/sequence sends through it.
- Compatibility bridge for `broadcastSubscribedAt` with explicit migration state.

## Phase 2 — Sequence lifecycle hardening (P0)

- Extend enrollment state machine.
- Atomic stop-on-reply and stop-on-conversion.
- Quiet hours/timezone scheduling.
- Re-entry policy and max-entry controls.
- Re-check policy at execution time, not only enrollment time.
- Add restart/retry/duplicate-job tests and 90-day virtual-time tests.

## Phase 3 — Attribution evidence + enrichment (P0)

- Persist raw referral payload immediately.
- Normalize to `AttributionTouch`.
- Back-reference existing `ctwaClid`/conversion code to touch ID.
- Add optional Marketing API enrichment worker with retry and explicit provenance.
- Add attribution UI/API views.

## Phase 4 — Conversion delivery ledger/replay (P0)

- Extend current Meta conversion delivery with deterministic business event IDs.
- Add attempt ledger and error taxonomy.
- Add retry/dead-letter/replay service.
- Add admin/API delivery diagnostics.

## Phase 5 — WordPress/FluentCRM/WooCommerce contract (P1)

- Add HMAC-signed `crm.*` outbound events.
- Add inbound idempotent upsert endpoints.
- Add mapping config and conflict rules.
- Publish reference WordPress adapter contract and sample plugin skeleton (separate package/example, no core dependency).
- Map WooCommerce paid/refund lifecycle to Deal and conversion events.

## Phase 6 — Native sales pipeline (P1)

- Add Pipeline/Stage/Deal/Activity models and services.
- Add event-bus events and flow triggers.
- Add Kanban/list UI + inbox summary.
- Wire won/lost outcomes into conversion rules.

## Phase 7 — Meta audience sync (P2)

- Separate `ads_audience` permission model.
- Provider-neutral audience sync domain.
- Meta adapter, incremental jobs, add/remove reconciliation.
- Privacy and hashing tests.

## Phase 8 — Ops, load, recovery, docs (P1)

- Metrics/dashboards, audit trail, replay UX.
- Failure injection: Redis restart, worker restart, provider 429/5xx, duplicate webhook, delayed WP endpoint.
- Load target >= 10,000 leads/month equivalent and >= 40,000 scheduled WhatsApp nurture sends/month.
- Backup/recovery and upgrade runbooks.

## Rollout

1. Ship schema + shadow consent policy in observe-only mode.
2. Compare policy decisions vs current sends.
3. Enforce for new workspaces/campaigns.
4. Provide migration wizard/report for existing workspaces.
5. Enable pipeline and WordPress adapter independently behind workspace feature flags.
6. Keep audience sync disabled by default until explicitly configured.
