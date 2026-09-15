# Research v2 — Brownfield Decisions

Base audited: `3196f01dd2027279016fb180c48764e128669483`.

## Decision 1 — sequence work is hardening, not a new engine

Existing system already persists enrollments/dispatches, calculates delayed next runs, schedules via Redis, locks dispatches, retries BullMQ jobs, cancels pending dispatches and supports send-day/time windows. The feature must reuse these primitives.

True deltas:
- exact ContactInbox routing per dispatch;
- automatic stop-on-reply/terminal conditions;
- execution-time policy checks;
- explicit completed-sequence re-entry policy/history;
- timezone/DST-safe windows;
- one canonical next-run calculation across enrollment paths.

## Decision 2 — extend native send policy

Broadcasts already enforce channel/message-window constraints in backend execution/preview logic. WhatsApp templates already expose MARKETING/UTILITY/AUTHENTICATION categories. Messaging consent must extend this policy seam rather than become a separate parallel sender.

## Decision 3 — consent evidence is a real new domain

`broadcastSubscribedAt` is an efficient current subscription timestamp, but it cannot prove channel/purpose/source/text-version/evidence. Keep it for compatibility during migration while new policy uses a purpose-specific consent record/event history.

## Decision 4 — attribution history complements ContactInbox.referral

`ContactInbox.referral` already stores ctwaClid, ad/source fields and raw JSON. Its update path merges later referrals into the same JSONB object. Therefore it remains the latest/current view, while a new append-only touch history preserves multi-touch provenance.

## Decision 5 — preserve both Meta conversion pipelines

The AdsConversionEvent pipeline already has attribution gates, deterministic source-event dedupe, pending/sent/failed/skipped states, retryable error propagation and stranded-pending recovery. `sendMetaCapiEvent` is intentionally independent and supports other event semantics such as QualifiedLead/Purchase.

Do not merge or replace them. Add only missing operator recovery/attempt evidence and links to new sales outcomes/attribution history.

## Decision 6 — Meta audience provider integration already exists

The codebase already supports per-contact Facebook Custom Audience actions and a bulk CTWA retarget audience worker using hashed PII. Bulk retarget currently uses add batches; durable membership reconciliation and permission governance were not found. Extend the native adapter.

## Decision 7 — webhook HMAC is a P0 security closure

The manual webhook route checks for `x-hub-signature-256`, but the WhatsApp handler constructs `whatsapp-api-js` middleware with `secure: false`. Library semantics define that mode as skipping signature verification. The configured client/app secret is not used in the shown middleware construction. Presence of a signature-shaped header is not authentication.

## Decision 8 — WordPress and sales pipeline are genuine product gaps

No first-class WordPress/FluentCRM/WooCommerce integration and no native CRM Deal/Pipeline schema were found in the audited tree. These remain P1 additions.

## Decision 9 — sequence per-inbox routing is a P0 correctness issue

Enrollment/advance creates one dispatch for each ContactInbox. `sendSequenceFlow` carries a ContactInbox id but calls `sendFlowDirect` without it; `sendFlowDirect` enumerates all ContactInboxes and runs the flow on each. Flow execution keys support asynchronous continuation identity, but no top-level claim was found that converts this fan-out into one targeted inbox execution. Characterization must land first, then the executor should consume the dispatch inbox explicitly.

## Decision 10 — fail closed at race boundaries

For security, consent, reply-stop and terminal-state races, under-delivery is preferable to a prohibited/duplicate send. Execution-time checks are required even when enrollment or audience selection passed an earlier check.
