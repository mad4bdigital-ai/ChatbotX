# Implementation Plan v2 — Root-Cause Order

## Rule

No greenfield replacement of a native subsystem is permitted until characterization proves the existing seam cannot satisfy the requirement.

## Gate 0 — Characterize before mutation

1. Reproduce manual WhatsApp webhook acceptance with valid/invalid signatures on base SHA.
2. Reproduce sequence execution for a contact with at least two ContactInboxes; count dispatches, flow runs and message-producing sends.
3. Trace all sequence removal callers and confirm inbound reply is not wired.
4. Trace all MARKETING template/broadcast/sequence send entry points.
5. Freeze current CAPI and Custom Audience behavior with characterization tests.

## Patch A — P0 webhook authenticity

Primary seams:
- `apps/builder/src/app/integrations/whatsapp/webhook/[integrationId]/route.ts`
- `integrations/whatsapp/src/handlers/webhook.ts`

Actions:
- bounded body preflight/read;
- authenticated HMAC over exact bytes using configured app/client secret;
- configure middleware/verification in secure mode or equivalent explicit verifier;
- enqueue only after verified;
- regression tests for valid/invalid/missing/malformed/oversized requests and Meta redelivery.

## Patch B — P0 sequence routing correctness

Primary seams:
- `packages/sequence-scheduler/src/enroll-contact.ts`
- `packages/sequence-scheduler/src/advance-enrollment.ts`
- `apps/worker/src/integration/handlers/sequence-flow.ts`
- `apps/worker/src/integration/handlers/send-flow-direct.ts`

Actions:
- make sequence direct execution accept exact `contactInboxId`;
- validate that inbox belongs to workspace/contact/conversation;
- execute `runFlowNode` exactly once for that dispatch target;
- retain one dispatch per intended inbox only;
- add multi-inbox + retry regression tests.

## Patch C — P0 sequence policy/stop-on-reply

Reuse `contactSequenceService.removeContactSequencesForContact(s)` and existing dispatch cancellation/scheduler cleanup.

Actions:
- define per-sequence stop-on-reply policy;
- wire genuine inbound customer message after durable persistence;
- add execution-time policy guard before message-producing sequence flow;
- suppress send if enrollment disappeared/stopped, contact is blocked, consent revoked, reply stop fired, or CRM terminal state applies;
- preserve under-delivery preference in cancellation races.

## Patch D — P0 consent evidence and category-aware send authorization

Reuse:
- `broadcastSubscribedAt` compatibility state;
- WhatsApp template category metadata;
- existing 24h broadcast policy seam.

Actions:
- add MessagingConsent + append-only event history;
- add flow/API/agent grant/revoke surfaces;
- category-aware marketing authorization;
- integrate at native broadcast/sequence/direct-automation execution seams;
- migration/report for legacy subscription state without asserting nonexistent evidence.

## Patch E — P0 scheduler timing consistency

Reuse native delay/specific-date/send-day/window scheduler.

Actions:
- canonical next-run calculation shared by all enrollment paths;
- explicit IANA timezone source/snapshot;
- DST-safe valid-window search;
- replace fallback-to-base-time with explicit no-valid-window outcome;
- 60/90-day virtual-clock tests.

## Patch F — P1 attribution history

- Add AttributionTouch append-only history.
- Hook only on attributable provider touch, not every tracking update.
- Keep `ContactInbox.referral` untouched as materialized latest/current state.
- Optional Meta lookup enrichment stored as derived/versioned fields.

## Patch G — P1 conversion operator recovery

- Preserve both existing conversion pipelines.
- Add attempt/replay metadata only at their current send seams.
- Add privileged failed-event replay and unified diagnostics; no new provider delivery engine.

## Patch H — P1 CRM integration and sales pipeline

- Contract-first WordPress/FluentCRM/WooCommerce adapter.
- Minimal Pipeline/Stage/Deal/Activity domain.
- Deal outcome events connect to sequence policy and existing conversion-event rules.

## Patch I — P1 audience governance/reconciliation

Reuse `facebookCustomAudience` and `sync-retarget-audience`.

- independent audience-use permission;
- desired/provider membership state or reconciliation cursor;
- add/remove diff processing;
- revoke/exclusion removal;
- failure/reconciliation diagnostics.

## Release gates

P0 merges require:
- exact-base characterization evidence;
- security/correctness regression tests;
- tenant-isolation tests;
- build/type/lint/current repository checks;
- no modifications to enterprise-only code required for feature completeness.

P1 activation remains feature-flagged until P0 is green end-to-end.
