# Research & Brownfield Delta

## Exact baseline

Repository: `ChatbotXIO/ChatbotX`  
SHA: `3196f01dd2027279016fb180c48764e128669483`

## Verified existing capabilities

1. `README.md` documents Visual Flow Builder, live inbox, Contact CRM, broadcasting, sequences, webhooks/HTTP and WhatsApp.
2. `docs/ads-conversion-tracking.md`, `packages/business/src/ads-conversion/*` and worker handlers already implement CTWA/CAPI concepts, including an attribution gate around `ctwaClid`.
3. `packages/database/src/schema/contact.ts` contains `subscribedAt` and `broadcastSubscribedAt`; this is useful current state but does not by itself preserve channel/purpose/source/text-version consent evidence.
4. `packages/flow-config/src/steps/unsubscribe-sequence.ts` and `unsubscribe-broadcast.ts` prove sequence/broadcast unsubscribe actions already exist.
5. WhatsApp Flow, option list and template steps already exist in `packages/flow-config` and `integrations/whatsapp`.
6. The repository is MIT for Community Edition code except the explicitly commercial `apps/builder/src/enterprise` directory.

## Key design decisions

### D1 — Extend, do not replace, current subscription fields
Keep `broadcastSubscribedAt` for compatibility and fast legacy filters. Introduce channel/purpose consent models and gradually make policy decisions rely on them. Migration may seed an “unknown legacy basis” record only where explicitly safe; otherwise fail closed for marketing until consent is collected.

### D2 — Preserve raw CTWA evidence separately from enrichment
The WhatsApp webhook/referral payload is evidence. Marketing API enrichment is derived data. Store them separately so API lookup outages or changed names never alter historical provenance.

### D3 — Keep sequence scheduler durable and event-driven
Do not implement long sleeps. Use persisted next-action times + existing queue/scheduler infrastructure. Before each send, evaluate current policy and terminal-state conditions.

### D4 — WordPress is an external CRM/commerce adapter, not a hard dependency
Use signed webhooks/API contracts. FluentCRM and WooCommerce are reference adapters. This preserves the upstream product’s framework independence.

### D5 — Minimal native sales pipeline
A thin pipeline/deal layer closes the largest Kommo-like gap while avoiding ERP complexity. Activities beyond messaging/tasks can remain external integrations.

### D6 — Audience permission is distinct
WhatsApp opt-in does not imply consent/eligibility for Meta Custom Audiences. Model `ads_audience` separately and allow workspaces to disable the capability entirely.

## Risks

- Meta API fields and CAPI requirements can change; provider-version behavior must be isolated behind integration adapters.
- Existing sequence internals may already cover portions of stop/re-entry semantics; implementation must reuse them rather than fork scheduler behavior.
- Consent migration from generic flags is legally/contextually ambiguous; default to no fabricated evidence.
- Sales pipeline feature can expand scope quickly; keep v1 limited to pipeline/stage/deal/activity and event hooks.
