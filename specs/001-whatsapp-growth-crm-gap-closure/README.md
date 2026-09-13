# 001 — WhatsApp Growth CRM Gap Closure

**Branch:** `001-whatsapp-growth-crm-gap-closure`  
**Audited upstream base:** `3196f01dd2027279016fb180c48764e128669483`  
**Mode:** brownfield extension — reuse native systems first; do not rebuild them.

## Native capabilities confirmed by code audit

ChatbotX already has substantially more of the target stack than the initial research suggested:

- Official WhatsApp Cloud API integration, templates, WhatsApp Flows and option lists.
- Visual Flow Builder, team inbox, contacts, tags/custom fields and filters.
- Broadcast engine with backend-enforced 24-hour messaging-window rules where applicable.
- Durable sequence scheduler with persisted enrollments/dispatches, Redis schedule, DB locks, retries, cancellation primitives, allowed send days/time windows and flow subscribe/unsubscribe actions.
- CTWA referral capture on `ContactInbox`, including `ctwaClid`, ad/source fields and raw referral JSON.
- Two existing Meta conversion systems: AdsConversionEvent rules/automatic events and independent `sendMetaCapiEvent` flows.
- QualifiedLead/Purchase/lead conversion support, deterministic event/source IDs, retryable-vs-terminal error handling and delivery summaries.
- Meta Custom Audience flow action and bulk CTWA retarget-audience sync with hashed PII.
- Public API/webhooks and mature queue/worker infrastructure.

## True gaps after deep audit

### P0 — correctness/security/compliance

1. **WhatsApp webhook HMAC verification:** the manual webhook route checks that `x-hub-signature-256` exists, but the WhatsApp middleware is created with `secure: false`; signature authenticity is therefore not enforced by the current handler. Fix raw-body HMAC verification before any enqueue, add bounded body size and replay/idempotency tests.
2. **Sequence per-inbox routing:** enrollment creates a dispatch per ContactInbox, but `sendFlowDirect()` ignores the dispatch ContactInbox and fans the same flow across all contact inboxes. Characterize and fix so each dispatch executes only against its intended inbox; prove no N×N fan-out for multi-inbox contacts.
3. **Stop-on-reply:** cancellation primitives exist, but inbound-message handling does not automatically remove/stop active sequence enrollments. Add an atomic policy using existing cancellation code.
4. **Execution-time marketing policy:** extend existing 24h/template policy rather than create a parallel sender. Re-check active WhatsApp marketing consent, block state, template category/window, sequence terminal state and intended ContactInbox immediately before execution.
5. **Auditable WhatsApp consent:** current `broadcastSubscribedAt` is useful materialized state but lacks channel/purpose/source/text-version/evidence history.
6. **Sequence timing consistency:** unify flow-enrollment delay calculation with normal scheduler semantics; make send windows timezone/DST-aware and fail closed when no valid window can be resolved.

### P1 — product completion

7. **Immutable attribution history:** preserve `ContactInbox.referral` as the current/latest materialized view, but add an append-only attribution-touch history so later referrals do not erase prior raw evidence.
8. **CAPI operator recovery:** keep both existing conversion pipelines independent; add attempt history/replay diagnostics only where missing. Do not rebuild their current dedupe/retry engines.
9. **WordPress/FluentCRM/WooCommerce adapter:** no first-class native integration was found. Add signed, idempotent contract-based sync without making WordPress a core runtime dependency.
10. **Native sales pipeline/deals:** no CRM Deal/Pipeline domain was found. Add a deliberately small Pipeline/Stage/Deal/Activity layer that can drive sequence stop conditions and existing conversion rules.
11. **Retarget-audience governance:** Meta audience adapters already exist. Add permission/consent governance, durable membership state, removal/reconciliation and observable failures instead of writing another Meta adapter.

## Explicit non-goals

- No QR/Baileys/WhatsApp-Web automation.
- No replacement sequence engine.
- No third conversion/CAPI pipeline.
- No duplicate Custom Audience provider adapter.
- No replacement of `ContactInbox.referral`; history complements it.
- No required implementation under `apps/builder/src/enterprise`.
