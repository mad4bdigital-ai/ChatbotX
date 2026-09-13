# Tasks v2 — Evidence-Driven Work Map

## Gate 0 — characterization (must land before behavior changes)

- [ ] T001 Add valid/invalid/missing WhatsApp HMAC characterization tests around manual webhook route + integration handler.
- [ ] T002 Add oversized WhatsApp webhook characterization test and record current side effects.
- [ ] T003 Build a contact fixture with two ContactInboxes and one sequence; assert current dispatch count and flow-run count.
- [ ] T004 Add regression test around `sendFlowDirect` proving whether one dispatch fans over all inboxes on base SHA.
- [ ] T005 Enumerate exact callers of sequence removal; freeze current manual/flow unsubscribe behavior.
- [ ] T006 Add inbound-reply test proving no automatic sequence stop exists on base SHA.
- [ ] T007 Characterize flow enrollment delay/specificDate behavior against normal enrollment path.
- [ ] T008 Characterize send-window behavior with timezone/DST boundary and no-valid-slot case.
- [ ] T009 Enumerate every WhatsApp MARKETING template/broadcast/sequence/direct-automation send seam.
- [ ] T010 Freeze current AdsConversionEvent retry/status behavior.
- [ ] T011 Freeze current `sendMetaCapiEvent` behavior separately.
- [ ] T012 Freeze per-contact Custom Audience add/remove and bulk retarget add behavior.

## Patch A — P0 WhatsApp webhook authenticity

- [ ] T020 Enforce bounded body size before full untrusted-body processing.
- [ ] T021 Verify `x-hub-signature-256` over exact raw bytes with configured Meta app/client secret.
- [ ] T022 Remove/replace `secure:false` behavior for authenticated POST processing.
- [ ] T023 Ensure invalid signature creates zero queue/database side effects.
- [ ] T024 Preserve Meta handshake behavior independently from POST HMAC verification.
- [ ] T025 Add tests for valid, invalid, malformed, missing signature and oversized body.
- [ ] T026 Add duplicate valid webhook/idempotency regression tests.
- [ ] T027 Review diagnostic logging order so untrusted body is not fully processed before authentication.

## Patch B — P0 sequence per-inbox correctness

- [ ] T030 Change sequence direct executor contract to require the dispatch `contactInboxId`.
- [ ] T031 Validate ContactInbox belongs to the dispatch workspace/contact and active conversation context.
- [ ] T032 Execute `runFlowNode` only for that exact ContactInbox.
- [ ] T033 Keep enrollment/advance one-dispatch-per-intended-inbox semantics.
- [ ] T034 Add two-inbox regression proving one dispatch → one inbox flow execution.
- [ ] T035 Add retry regression proving no duplicate message-producing work.
- [ ] T036 Add removed/stale ContactInbox behavior: cancel/skip with explicit reason rather than fan out.

## Patch C — P0 stop-on-reply + execution-time policy

- [ ] T040 Add sequence configuration/policy for stop-on-reply.
- [ ] T041 After durable genuine inbound customer message, invoke existing sequence cancellation primitives for eligible active enrollments.
- [ ] T042 Ensure cancellation uses DB-first state transition/removal and scheduler cleanup already provided by contactSequenceService.
- [ ] T043 Add execution-time guard before sequence flow message production.
- [ ] T044 Guard on enrollment still-active/current dispatch relationship.
- [ ] T045 Guard on contact/channel blocked state.
- [ ] T046 Guard on consent/template/window policy.
- [ ] T047 Add reply-vs-running-dispatch race test; prefer no send after stop condition.
- [ ] T048 Add manual unsubscribe/stop compatibility tests.

## Patch D — P0 auditable WhatsApp consent

- [ ] T050 Add MessagingConsent migration/model with workspace/contact/channel/purpose unique key.
- [ ] T051 Add append-only MessagingConsentEvent model.
- [ ] T052 Implement idempotent grant/revoke service and immutable event append.
- [ ] T053 Add flow actions for grant/revoke messaging consent.
- [ ] T054 Add agent/API surfaces for consent state/history.
- [ ] T055 Add configurable WhatsApp opt-out/re-opt-in keyword/structured-response integration.
- [ ] T056 Extend native send policy seam for MARKETING template authorization.
- [ ] T057 Preserve UTILITY/service policy separately from marketing authorization.
- [ ] T058 Integrate policy into broadcast, sequence and direct automated MARKETING sends.
- [ ] T059 Legacy `broadcastSubscribedAt` migration/report: never invent source/text/evidence.
- [ ] T060 Add queued-send suppression test after consent revoke.
- [ ] T061 Add cross-workspace/idempotency/race tests.

## Patch E — P0 sequence time semantics

- [ ] T070 Extract one canonical next-run calculator used by flow/manual/bulk enrollment and advance.
- [ ] T071 Fix any `enrollFromFlow` delayUnit/specificDateTime drift found by T007.
- [ ] T072 Add explicit timezone selection/snapshot (contact preferred, workspace fallback per product decision).
- [ ] T073 Make allowed-day/time-window search DST-safe.
- [ ] T074 Replace fallback-to-base-time on no valid window with explicit unschedulable/paused result.
- [ ] T075 Add spring-forward/fall-back tests plus 60/90-day virtual-time sequence test.
- [ ] T076 Define completed-enrollment re-entry policy and history semantics instead of bypassing current unique key.

## Patch F — P1 immutable attribution history

- [ ] T080 Add AttributionTouch append-only model with workspace/contact/inbox scope.
- [ ] T081 Define deterministic touch idempotency key/fingerprint.
- [ ] T082 Append touch when a new attributable provider referral is received.
- [ ] T083 Keep current `ContactInbox.referral` merge behavior as materialized latest view.
- [ ] T084 Add optional versioned Meta enrichment without mutating raw touch evidence.
- [ ] T085 Add first-touch/last-touch/conversion-touch queries and tests.

## Patch G — P1 CAPI operator recovery

- [ ] T090 Confirm no existing privileged failed-event replay endpoint across both conversion pipelines.
- [ ] T091 Define minimal attempt-history extension only where current status/ErrorLog lacks operator evidence.
- [ ] T092 Add privileged replay for eligible failed AdsConversionEvent preserving sourceEventId/business identity.
- [ ] T093 Add equivalent recovery only for `sendMetaCapiEvent` if its current semantics need it; do not merge tables.
- [ ] T094 Add sent-event replay guard and audit trail.
- [ ] T095 Add unified diagnostic view linking current status, last error, attempts and replay action.

## Patch H — P1 WordPress/FluentCRM/WooCommerce

- [ ] T100 Add ExternalObjectLink identity map.
- [ ] T101 Define signed `crm.*` outbound event catalog.
- [ ] T102 Implement HMAC/timestamp/idempotent inbound CRM event endpoint.
- [ ] T103 Add field-ownership/conflict policy.
- [ ] T104 Normalize `wa_id`/E.164/email mappings.
- [ ] T105 Publish FluentCRM reference mapping.
- [ ] T106 Publish WooCommerce order.created/paid/refunded/cancelled mappings.
- [ ] T107 Add optional WordPress reference adapter/plugin skeleton outside core dependency.
- [ ] T108 Add sync-loop and delayed-endpoint recovery tests.

## Patch I — P1 native sales pipeline

- [ ] T110 Add Pipeline and PipelineStage schemas/services.
- [ ] T111 Add Deal and DealActivity schemas/services.
- [ ] T112 Add owner/value/currency/expected-close/won-lost/source-attribution fields.
- [ ] T113 Emit workspace-scoped deal events.
- [ ] T114 Add flow/sequence stop/action hooks from deal stage/status.
- [ ] T115 Map Won/Purchase outcomes into existing conversion-rule seams rather than a new CAPI system.
- [ ] T116 Add bounded Kanban/list/inbox deal UI.
- [ ] T117 Add tenancy/concurrency tests.

## Patch J — P1 audience governance/reconciliation

- [ ] T120 Reuse current `facebookCustomAudience` and retarget sync integration actions.
- [ ] T121 Add independent `ads_audience` permission policy.
- [ ] T122 Add durable desired/provider membership or equivalent reconciliation state.
- [ ] T123 Extend bulk retarget sync from add-only behavior to add/remove reconciliation.
- [ ] T124 Remove/exclude audience membership on permission revoke/segment exit.
- [ ] T125 Add rate-limit/retry/reconciliation status and tests.
- [ ] T126 Keep unhashed PII out of durable provider-match payload storage where not required.

## Release / evidence

- [ ] T130 Run repository lint/type/build/test checks.
- [ ] T131 Run tenant-isolation tests for every new table/API/worker path.
- [ ] T132 Run failure injection for Redis/worker/provider/WordPress outages.
- [ ] T133 Load-test >=10,000 leads/month equivalent and >=40,000 scheduled nurture sends/month.
- [ ] T134 E2E: CTWA → authenticated webhook → attribution → consent → sequence exact inbox → reply stop → deal won → existing CAPI → WordPress sync → audience reconciliation.
- [ ] T135 Run Spec Kit analyze/checklist gate and resolve every P0/P1 contradiction before implementation-ready status.
