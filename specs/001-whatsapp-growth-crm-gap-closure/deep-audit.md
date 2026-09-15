# Deep Brownfield Audit v2

Baseline: `3196f01dd2027279016fb180c48764e128669483`.

## Capability map

| Domain | Current state | Audit conclusion |
|---|---|---|
| WhatsApp transport | Official integration exists | Reuse; harden webhook authenticity |
| Broadcast policy | Native 24h backend constraint exists | Extend with consent/category policy |
| Sequences | Persisted scheduler/enrollment/dispatch/retry/cancel exists | Harden; do not rebuild |
| Sequence stop-on-reply | No automatic inbound-message caller found | True P0 gap |
| Sequence re-entry | Unique enrollment blocks normal completed re-enrollment; manual unsubscribe deletes enrollment | Define explicit history/re-entry policy |
| Send windows | Days/start/end exist | Add timezone/DST semantics and fail-closed resolution |
| CTWA attribution | Current referral + `raw` exists on ContactInbox | Add immutable multi-touch history only |
| AdsConversionEvent CAPI | Mature native pipeline | Add operator replay/attempt visibility, not new pipeline |
| sendMetaCapiEvent | Separate mature pipeline incl. QualifiedLead/Purchase | Keep separate by design |
| Meta Custom Audience | Per-contact action + bulk retarget add exist | Add governance/reconciliation/removal |
| WordPress/FluentCRM/WooCommerce | No first-class native adapter found | True P1 gap |
| Sales Pipeline/Deals | No native Deal/Pipeline schema found | True P1 gap |

## P0-SEC-01 — WhatsApp webhook authenticity

The manual webhook route checks the signature header shape then delegates to the WhatsApp integration. The integration constructs `whatsapp-api-js` middleware with `secure: false` and does not feed the configured client/app secret into that middleware. In `whatsapp-api-js`, secure=false disables signature verification. Therefore a syntactically present `sha256=...` header is not equivalent to an authenticated Meta webhook.

Required closure:
- enforce maximum Content-Length / bounded streaming read before payload logging/parsing;
- verify exact raw bytes with Meta app secret and `x-hub-signature-256` before extracting/enqueuing events;
- use constant-time comparison/library secure mode;
- invalid signatures must produce no side effects;
- add valid, invalid, missing, malformed and oversized-body tests;
- preserve deterministic message/event idempotency for genuine Meta retries.

## P0-SEQ-01 — multi-inbox dispatch routing

`enrollContactInSequence()` and `advanceEnrollment()` create one dispatch per ContactInbox. `sequence-flow.ts` receives `contactInboxId`, but `sendFlowDirect()` accepts only contactId and loads every ContactInbox before calling `runFlowNode()` for each. The execution key is propagated for continuation identity; no top-level claim was found that changes the fact that each sequence dispatch invokes the flow against all inboxes.

Required closure:
- characterize current behavior with contact having >=2 ContactInboxes;
- change direct sequence execution to use the dispatch's exact ContactInbox;
- retain workspace/contact/conversation validation;
- prove one dispatch → one intended inbox execution;
- prove retries are idempotent and do not fan out;
- ensure advanceEnrollment keeps one dispatch per eligible intended inbox only.

## P0-SEQ-02 — stop-on-reply and execution-time policy

Sequence cancellation already supports DB-first cancellation of pending dispatches and best-effort scheduler cleanup. Exact callers found are manual/flow/service operations, not inbound-message stop-on-reply.

Required closure:
- after a genuine inbound customer message is persisted, atomically mark/remove relevant active enrollment according to sequence policy;
- use existing cancellation primitives rather than raw deletes;
- a running dispatch must re-check terminal state immediately before send;
- cancellation races must prefer under-delivery over sending after reply/opt-out.

## P0-SEQ-03 — timing semantics

Native scheduler supports delay units, specific dates, allowed send days and start/end windows. The validator uses ordinary Date semantics without a target timezone and falls back to the original base time after a bounded search.

Required closure:
- one canonical next-run calculator across all enrollment entry points;
- IANA timezone snapshot/selection and DST-safe calculation;
- no valid window => explicit paused/failed schedule state, never send at base time outside the window;
- virtual-time tests across DST and 60/90-day programs.

## P0-CONSENT-01 — marketing authorization

`broadcastSubscribedAt` is an idempotent materialized flag/timestamp, not a legal/audit evidence model. WhatsApp templates already expose MARKETING/UTILITY/AUTHENTICATION categories and broadcast delivery already has cross-cutting 24h constraints.

Required closure:
- append-only consent evidence + current materialized channel/purpose state;
- category-aware policy: MARKETING requires active marketing authorization; service/utility rules stay distinct;
- centralized decision callable by broadcasts, sequences and direct automation sends;
- revocation suppresses queued-but-not-yet-sent marketing work.

## P1-ATTR-01 — immutable attribution touch history

`ContactInbox.referral` is useful current state and already stores raw payload, ctwaClid and ad metadata. `updateTracking()` merges the incoming referral object into the same JSONB value, so later values can replace prior keys/raw evidence.

Required closure:
- append AttributionTouch only when a new attributable referral/message touch occurs;
- keep ContactInbox.referral as latest/materialized compatibility view;
- derive first/last/conversion-touch without rewriting historical rows;
- Marketing API enrichment is derived/versioned data, never a rewrite of raw evidence.

## P1-CAPI-01 — operator recovery, not a new CAPI engine

AdsConversionEvent already has deterministic dedupe, pending/sent/failed/skipped statuses, retryable error propagation, recovery for stranded pending rows and dashboard summaries. `sendMetaCapiEvent` is intentionally independent and supports additional Business Messaging events.

Required closure:
- retain both systems;
- add attempt history only where needed for diagnosis;
- add privileged replay for eligible failed delivery while preserving source/business identity;
- surface skipped/failed reason and replay history consistently without merging domain tables.

## P1-AUDIENCE-01 — governance/reconciliation

Existing native support includes per-contact Custom Audience add/remove actions and bulk CTWA retarget sync. Bulk retarget currently adds batches; no durable membership/reconciliation or separate audience permission gate was identified.

Required closure:
- model audience-use permission separately from WhatsApp marketing consent;
- persist desired/provider membership status or equivalent reconciliation cursor;
- remove contacts on revoke/exclusion;
- reconcile drift and expose failures;
- reuse existing Meta Facebook Ads integration actions.
