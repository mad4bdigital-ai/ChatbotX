# Feature Specification v2: WhatsApp Growth CRM Brownfield Closure

## Objective

Close only the gaps proven against base `3196f01dd2027279016fb180c48764e128669483`, while reusing ChatbotX's existing broadcast, sequence, CTWA, CAPI and Meta Audience systems.

## P0 User Stories

### US-P0-1 — Authenticated WhatsApp webhooks
As an operator, I need webhook POSTs to be cryptographically authenticated before any parse/enqueue side effect.

Acceptance:
- valid Meta HMAC over exact raw body is accepted;
- missing/malformed/incorrect signature is rejected with zero queue/database side effects;
- body size is bounded before full diagnostic parsing;
- genuine duplicate Meta deliveries remain idempotent downstream.

### US-P0-2 — One sequence dispatch targets one ContactInbox
As a marketer, I need a sequence step to execute only for the ContactInbox represented by its dispatch.

Acceptance:
- contact with two inboxes produces at most one flow execution for each intended dispatch/inbox pair;
- sequence execution does not call the same flow over all inboxes from each dispatch;
- retry of the same dispatch does not duplicate message-producing work;
- workspace/contact/conversation ownership is validated before execution.

### US-P0-3 — Stop sequence on reply/opt-out/terminal state
As a sales team, I need pending nurture messages to stop once the customer replies, opts out or reaches a configured terminal state.

Acceptance:
- genuine inbound reply invokes sequence policy after durable message persistence;
- existing DB-first cancellation primitives are reused;
- queued/running work re-checks terminal state before message execution;
- race preference is fail-closed/under-delivery after reply or opt-out.

### US-P0-4 — Auditable WhatsApp marketing consent
As a compliance-aware marketer, I need authorization evidence beyond `broadcastSubscribedAt`.

Acceptance:
- current consent state is keyed by workspace/contact/channel/purpose;
- immutable events retain grant/revoke time, source, text version, actor and evidence;
- MARKETING template sends require active WhatsApp marketing consent;
- UTILITY/service policy is evaluated separately;
- revocation prevents not-yet-sent marketing work;
- legacy subscription timestamp is not converted into fabricated evidence.

### US-P0-5 — Correct sequence time semantics
As a marketer, I need sequence windows to respect local timezone/DST and never silently send outside the configured window.

Acceptance:
- one canonical delay/specific-date/window calculator is used by every enrollment path;
- IANA timezone is explicit/snapshotted;
- DST transitions are tested;
- no valid future slot becomes an explicit paused/failed condition, never fallback to the original disallowed time.

## P1 User Stories

### US-P1-1 — Immutable multi-touch CTWA attribution
Keep `ContactInbox.referral` as current state but append an immutable touch when a new attributable referral arrives. Raw provider evidence and derived enrichment must be distinguishable.

### US-P1-2 — Recover failed Meta conversion deliveries
Keep the two existing conversion systems independent. Add diagnostic attempt history where useful and privileged replay for eligible failed events without creating a third conversion pipeline or changing business event identity.

### US-P1-3 — WordPress CRM/commerce adapter
Provide signed/idempotent event contracts for WordPress/FluentCRM/WooCommerce, identity mapping and field ownership rules. WordPress must remain optional.

### US-P1-4 — Minimal native sales pipeline
Add Pipeline, Stage, Deal and DealActivity with contact/owner/value/source/won-lost fields. Stage/status events can stop sequences and feed existing Meta conversion rules.

### US-P1-5 — Audience governance and reconciliation
Reuse existing Facebook Custom Audience actions/bulk retarget worker. Add separate `ads_audience` permission, durable desired/provider membership or equivalent reconciliation state, removals on revoke/exclusion and observable drift/failures.

## Functional Requirements

### Webhook security
- FR-001 Verify WhatsApp `x-hub-signature-256` against exact raw request bytes using the configured Meta app/client secret before queue work.
- FR-002 Do not run WhatsApp webhook middleware in a mode that disables signature verification for authenticated POSTs.
- FR-003 Enforce bounded request size before untrusted body logging/parsing.
- FR-004 Invalid signature/body must create no incomingMessage, automatic-event, coexist, or status jobs.

### Sequence correctness
- FR-010 Sequence dispatch execution MUST consume its stored `contactInboxId` directly.
- FR-011 `sendSequenceFlow` MUST NOT fan one dispatch across every ContactInbox for a contact.
- FR-012 Add a multi-inbox characterization/regression suite.
- FR-013 Inbound reply policy MUST use existing sequence cancellation service/primitives.
- FR-014 Before message-producing sequence execution, re-check enrollment active state, reply/terminal policy, blocked state and applicable marketing policy.
- FR-015 Preserve existing pending/running/completed/canceled/failed dispatch idempotency guards.
- FR-016 Define re-entry semantics explicitly; normal completed enrollment currently cannot re-enroll because of the unique key.
- FR-017 Unify `enrollFromFlow` and normal enrollment next-run calculation.
- FR-018 Make allowed-day/time-window calculation timezone/DST aware and fail closed when no valid slot resolves.

### Consent / send policy
- FR-020 Add current MessagingConsent state plus append-only MessagingConsentEvent history.
- FR-021 Initial purposes: `marketing`, `service`, `ads_audience`; initial channel: `whatsapp`.
- FR-022 Record source, captured/revoked timestamp, text/version, actor and evidence.
- FR-023 Extend the native broadcast/window/template policy seam instead of bypassing it.
- FR-024 MARKETING WhatsApp template/broadcast/sequence/direct automation sends require an active marketing authorization decision.
- FR-025 Existing `broadcastSubscribedAt` stays as a compatibility/materialized signal during migration but not as fabricated consent evidence.

### Attribution
- FR-030 Keep `ContactInbox.referral` as current/latest compatibility view.
- FR-031 Append immutable AttributionTouch rows for distinct attributable touches before/alongside current referral merge.
- FR-032 Keep raw provider evidence immutable; enrichment fields are derived/versioned.
- FR-033 Expose first/last/conversion touch query semantics.

### CAPI recovery
- FR-040 Preserve AdsConversionEvent and `sendMetaCapiEvent` as separate systems.
- FR-041 Reuse existing retryable/terminal classification and deterministic IDs.
- FR-042 Add operator-visible attempt/recovery history only where current status/error log is insufficient.
- FR-043 Add privileged replay for eligible failed events preserving original source/business identity.
- FR-044 Never replay `sent` events as a new business conversion without a distinct new business event.

### WordPress / CRM
- FR-050 Signed timestamped outbound `crm.*` events.
- FR-051 Idempotent signed inbound contact/deal/order event API.
- FR-052 Stable external-object identity map and configurable field ownership.
- FR-053 Reference adapters/documentation for FluentCRM and WooCommerce.

### Sales pipeline
- FR-060 Add workspace-scoped Pipeline, PipelineStage, Deal and DealActivity.
- FR-061 Deal links contact, owner, stage/status, value/currency and optional AttributionTouch.
- FR-062 Deal stage/status events are consumable by flow/sequence policy and existing conversion rule layer.
- FR-063 Add bounded Kanban/list/inbox summary; no ERP/project-accounting scope.

### Audience governance
- FR-070 Reuse native Facebook Ads audience actions and bulk sync.
- FR-071 Add independent `ads_audience` permission/policy.
- FR-072 Add remove/reconcile behavior for bulk retarget audience membership.
- FR-073 Add observable membership/sync state and retry/error diagnostics without persisting unnecessary unhashed match payloads.

## Non-Functional Requirements

- NFR-001 Zero cross-workspace access in new paths.
- NFR-002 Duplicate webhooks/jobs must not duplicate durable business effects.
- NFR-003 Sequence restart/retry must preserve exact intended inbox routing.
- NFR-004 PII/tokens/raw provider secrets remain redacted from default logs.
- NFR-005 P0 changes require characterization + regression + failure-path tests.
- NFR-006 Target workload: >=10x the intended 1,000 CTWA leads/month and 4 nurture sends/lead without architecture change.
