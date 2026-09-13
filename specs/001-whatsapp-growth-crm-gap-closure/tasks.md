# Tasks

## Phase 0 — Baseline and characterization

- [ ] T001 Record exact base SHA and repository version metadata in CI artifact.
- [ ] T002 Enumerate every WhatsApp/broadcast/sequence send entry point.
- [ ] T003 Add characterization tests for current `broadcastSubscribedAt` behavior.
- [ ] T004 Add characterization tests for sequence subscribe/unsubscribe actions.
- [ ] T005 Add characterization tests for inbound WhatsApp referral/`ctwaClid` parsing.
- [ ] T006 Add characterization tests for current Meta CAPI skip/send behavior.
- [ ] T007 Document current public API/webhook authentication paths.

## Phase 1 — Consent registry and policy gate

- [ ] T010 Add `MessagingConsent` schema/migration with workspace-scoped unique key.
- [ ] T011 Add append-only `MessagingConsentEvent` schema/migration.
- [ ] T012 Implement consent domain service with idempotent grant/revoke.
- [ ] T013 Implement consent query/filter service.
- [ ] T014 Implement compatibility bridge for legacy broadcast subscription state.
- [ ] T015 Add centralized marketing-send policy service.
- [ ] T016 Wire broadcast sends through policy service.
- [ ] T017 Wire sequence sends through policy service at execution time.
- [ ] T018 Add flow step schema/handler: grant messaging consent.
- [ ] T019 Add flow step schema/handler: revoke messaging consent.
- [ ] T020 Add builder editor/viewer for both consent steps.
- [ ] T021 Add configurable WhatsApp opt-out keyword handling.
- [ ] T022 Add configurable WhatsApp re-opt-in keyword/structured response handling.
- [ ] T023 Add contact UI consent summary + history drawer.
- [ ] T024 Add public/admin consent API.
- [ ] T025 Add tenancy/idempotency/race tests for consent changes.
- [ ] T026 Add tests proving queued marketing messages are suppressed after revocation.

## Phase 2 — Sequence lifecycle hardening

- [ ] T030 Audit existing sequence scheduler state model and reuse compatible fields.
- [ ] T031 Add/extend explicit enrollment status/stop reason model.
- [ ] T032 Implement atomic stop-on-inbound-reply.
- [ ] T033 Implement stop-on-deal status/stage hook.
- [ ] T034 Implement stop-on-goal event hook.
- [ ] T035 Implement re-entry policy and entry counter.
- [ ] T036 Implement cooldown/max-entry enforcement.
- [ ] T037 Implement quiet hours using contact/workspace timezone.
- [ ] T038 Add send-occurrence idempotency keys.
- [ ] T039 Ensure scheduler persists next action instead of process sleeps.
- [ ] T040 Add worker-restart/retry tests.
- [ ] T041 Add duplicate-job tests.
- [ ] T042 Add virtual-time test covering a 90-day sequence.
- [ ] T043 Add UI controls for stop/re-entry/quiet-hour policies.

## Phase 3 — Attribution evidence and enrichment

- [ ] T050 Add `AttributionTouch` schema/migration.
- [ ] T051 Persist raw WhatsApp referral payload before normalization.
- [ ] T052 Normalize CTWA fields without overwriting raw evidence.
- [ ] T053 Link contact/conversation/contactInbox to attribution touch.
- [ ] T054 Back-reference existing conversion logic to normalized touch where possible.
- [ ] T055 Add optional Meta Marketing API enrichment job.
- [ ] T056 Add enrichment retry/error taxonomy.
- [ ] T057 Add first-touch/last-touch/conversion-touch queries.
- [ ] T058 Add attribution detail UI/API.
- [ ] T059 Add tests for missing/partial referral payloads and lookup failure.

## Phase 4 — Meta conversion delivery ledger

- [ ] T060 Define deterministic business-event ID rules for Lead/Qualified/Won/Purchase.
- [ ] T061 Add/extend conversion delivery-attempt persistence.
- [ ] T062 Implement response/error classification.
- [ ] T063 Implement bounded exponential retry.
- [ ] T064 Implement dead-letter transition.
- [ ] T065 Implement privileged replay service preserving original business-event identity.
- [ ] T066 Add delivery status API.
- [ ] T067 Add builder/admin delivery diagnostics.
- [ ] T068 Add provider 429/5xx/permanent-error tests.
- [ ] T069 Add replay/deduplication tests.

## Phase 5 — WordPress / FluentCRM / WooCommerce integration

- [ ] T070 Add `ExternalObjectLink` schema/service.
- [ ] T071 Define `crm.*` event catalog.
- [ ] T072 Add HMAC timestamped webhook signing.
- [ ] T073 Add outbound retry/dead-letter policy for CRM webhooks.
- [ ] T074 Add inbound signed/idempotent CRM event endpoint.
- [ ] T075 Add configurable field ownership/conflict rules.
- [ ] T076 Add contact identity normalization for `wa_id`/E.164/email.
- [ ] T077 Add FluentCRM reference mapping documentation.
- [ ] T078 Add WooCommerce order paid/refund/cancel mapping documentation.
- [ ] T079 Add sample WordPress adapter skeleton outside core runtime dependency.
- [ ] T080 Add sync-loop prevention tests.
- [ ] T081 Add delayed/unavailable WordPress endpoint recovery tests.

## Phase 6 — Native sales pipeline

- [ ] T090 Add Pipeline schema/service.
- [ ] T091 Add PipelineStage schema/service and ordering.
- [ ] T092 Add Deal schema/service.
- [ ] T093 Add DealActivity audit/event schema/service.
- [ ] T094 Add deal owner/value/currency/expected-close/lost-reason fields.
- [ ] T095 Add deal event-bus events.
- [ ] T096 Add flow triggers/actions for stage/status/owner changes.
- [ ] T097 Add sequence stop conditions based on deal state.
- [ ] T098 Connect Won/Lost to conversion-rule triggers.
- [ ] T099 Add Kanban and list UI.
- [ ] T100 Add inbox/contact sidebar active deal summary.
- [ ] T101 Add deal API and external CRM mappings.
- [ ] T102 Add workspace isolation and concurrency tests.

## Phase 7 — Meta audience sync

- [ ] T110 Add `ads_audience` permission/consent purpose.
- [ ] T111 Add provider-neutral audience sync model/service.
- [ ] T112 Implement Meta Custom Audience adapter behind feature flag.
- [ ] T113 Implement incremental membership add/remove jobs.
- [ ] T114 Implement immediate removal on permission revoke/exclusion.
- [ ] T115 Add hashing/normalization immediately before provider request.
- [ ] T116 Add rate-limit/retry/reconciliation tests.

## Phase 8 — Ops, security and release evidence

- [ ] T120 Add webhook replay protection and body-size/rate-limit controls.
- [ ] T121 Verify current Meta signature contract and add tests.
- [ ] T122 Add PII-redaction rules to logs/traces.
- [ ] T123 Add metrics for webhook failures, queue lag, sequence lag, CAPI failures, CRM sync failures.
- [ ] T124 Add audit events for consent, replay, deal and audience mutations.
- [ ] T125 Add load test at >=10x target monthly lead/message volume.
- [ ] T126 Add fault-injection tests for Redis/worker/provider/CRM outages.
- [ ] T127 Write backup/recovery/replay runbook.
- [ ] T128 Write rolling-upgrade/migration runbook.
- [ ] T129 Run lint/build/circular/unused checks and all new test suites.
- [ ] T130 Run full E2E acceptance from CTWA → consent → sequence → deal → CAPI → WordPress sync.
- [ ] T131 Run Spec Kit analyze/checklist gate and resolve all P0/P1 inconsistencies.
