# Feature Specification: WhatsApp Growth CRM Gap Closure

## Problem Statement

ChatbotX already contains the core building blocks for WhatsApp automation, sequences, CTWA attribution and Meta conversion delivery. The remaining gap for a production WhatsApp-first sales/marketing system is not basic messaging; it is compliant consent evidence, durable lifecycle control, closed-loop attribution/feedback, CRM synchronization, and sales-state governance.

## Goals

- Make WhatsApp marketing consent explicit, auditable, revocable, and enforced centrally.
- Support safe 14/30/60+ day nurture programs that stop or pause on real customer state changes.
- Preserve CTWA referral evidence and enrich it without corrupting provenance.
- Send QualifiedLead/Won/Purchase outcomes back to Meta with traceable delivery semantics.
- Integrate WordPress/FluentCRM/WooCommerce without making WordPress a hard runtime dependency.
- Add a minimal first-class sales pipeline/deal model or expose a stable contract for an external CRM owner.
- Keep all P0/P1 functionality in the Community Edition path and outside enterprise-only directories.

## Non-Goals

- No unofficial WhatsApp Web/QR automation.
- No replacement of Meta template approval or billing logic.
- No requirement that WordPress be installed for ChatbotX to function.
- No migration of existing enterprise code into Community Edition.
- No claim that WhatsApp marketing consent equals Meta Ads custom-audience consent; those are separate purposes.

## User Stories

### US1 — Auditable WhatsApp marketing consent (P0)
As a marketing operator, I need to know whether a contact is authorized for WhatsApp marketing, when/how they consented, which wording they accepted, and when they revoked consent, so that campaigns and sequences can fail closed.

**Acceptance:**
- Consent can be granted/revoked via flow action, API, agent UI, and inbound keyword/structured response.
- Current status and immutable history are visible.
- Marketing sends are blocked when no active consent exists.
- Revocation immediately prevents not-yet-sent queued marketing steps.

### US2 — Durable long-running sequence lifecycle (P0)
As a marketer, I need 14/30/60-day nurture sequences that survive deploys and stop when a contact replies, opts out, becomes blocked, converts, or is manually removed.

**Acceptance:**
- Enrollments survive worker restarts.
- Stop-on-reply is atomic with pending schedule cancellation/suppression.
- Quiet hours/timezone rules are honored.
- Every send re-checks consent, template eligibility, block state, and terminal CRM state.
- Re-entry is controlled by configurable cooldown/max-entry rules.

### US3 — Trustworthy CTWA attribution (P0)
As a performance marketer, I need each eligible WhatsApp lead tied to original CTWA evidence without inventing unavailable identifiers, so downstream conversion reporting is trustworthy.

**Acceptance:**
- Raw referral payload is stored immutably with normalized fields.
- `ctwa_clid` is preserved where supplied.
- Optional ad/campaign/ad-set enrichment is recorded separately with lookup timestamp/source/version.
- Enrichment failures remain observable and do not erase original evidence.

### US4 — Closed-loop Meta conversion feedback (P0)
As a media buyer, I need QualifiedLead/Won/Purchase outcomes delivered to Meta with deterministic deduplication and visible retry status.

**Acceptance:**
- Event IDs are deterministic for the same business event.
- Delivery attempts are recorded.
- Transient failures retry with bounded backoff.
- Permanent failures are dead-lettered and replayable after correction.
- Skips explain missing identity/attribution/permission prerequisites.

### US5 — WordPress / FluentCRM / WooCommerce sync (P1)
As a site owner, I need WhatsApp leads and sales-state changes synchronized with WordPress while avoiding duplicate contacts and sync loops.

**Acceptance:**
- Signed outbound event contract and inbound upsert contract exist.
- `phone_e164` / `wa_id` identity rules are defined.
- Per-field ownership is configurable.
- Idempotency and source-version metadata prevent loops.
- WooCommerce order/paid/refund events can update deal/conversion state through the same contract.

### US6 — Native sales pipeline and deals (P1)
As a 3-agent sales team, I need leads to progress through a simple pipeline without moving to a separate CRM.

**Acceptance:**
- Workspaces can create pipelines/stages.
- Deal has owner, contact, stage, status, value/currency, source attribution, expected close date, won/lost timestamps and lost reason.
- Stage changes can trigger flows/sequences/CAPI rules.
- Inbox contact sidebar shows active deal summary.

### US7 — Privacy-safe Meta retargeting audience sync (P2)
As a marketer, I want eligible customer segments synchronized to Meta audiences, with independent consent/policy controls.

**Acceptance:**
- Audience sync is opt-in per workspace and per segment.
- Marketing consent and ads-audience permission are modeled separately.
- Removal is processed when permission is revoked or exclusion criteria apply.
- Hashing/normalization occurs immediately before provider submission; unhashed export payloads are not persisted unnecessarily.

### US8 — Operations, audit and recovery (P1)
As an operator, I need to diagnose lost webhooks, stuck sequences, failed CAPI deliveries and sync drift without inspecting production DB rows manually.

**Acceptance:**
- Health/metrics expose queue lag, webhook failures, sequence lag, CAPI failures, and sync failures.
- Audit events exist for consent changes, replay actions, manual deal changes, and audience changes.
- Backup/recovery runbook defines Postgres/Redis/object-storage responsibilities and replay boundaries.

## Functional Requirements

### Consent
- FR-001: Add a workspace-scoped `MessagingConsent` current-state model keyed by contact/channel/purpose.
- FR-002: Add append-only `MessagingConsentEvent` history.
- FR-003: Supported initial purposes: `marketing`, `service`, `ads_audience`.
- FR-004: Supported channels include `whatsapp`, with schema extensible to other channels.
- FR-005: Record status, capturedAt, revokedAt, source, textVersion, actorType/actorId, evidence JSON, external reference.
- FR-006: Add flow steps `grantMessagingConsent` and `revokeMessagingConsent`.
- FR-007: Add WhatsApp inbound opt-out keyword handling configurable by locale/workspace.
- FR-008: Add a centralized `assertCanSendMarketingMessage` policy service.
- FR-009: Broadcast and sequence marketing sends MUST call the policy service immediately before enqueue/send.
- FR-010: Existing `broadcastSubscribedAt` remains supported as a compatibility signal but cannot be the sole authorization after migration.

### Sequence lifecycle
- FR-011: Store durable enrollment state and next-action timestamp.
- FR-012: Add enrollment statuses: active, paused, completed, stopped_reply, stopped_optout, stopped_conversion, stopped_manual, failed.
- FR-013: Implement atomic stop-on-inbound-reply.
- FR-014: Add configurable stop-on-deal-stage/status rules.
- FR-015: Add configurable stop-on-goal event.
- FR-016: Add re-entry policy: never, after_cooldown, always; plus max entries.
- FR-017: Add workspace/contact timezone quiet-hour calculation.
- FR-018: Re-evaluate consent/template/block state on every scheduled send.
- FR-019: Idempotency key = enrollment + step + scheduled occurrence.
- FR-020: Sequence runtime MUST support at least 90 days without keeping a process or transaction open.

### Attribution
- FR-021: Persist raw CTWA/referral payload before normalization.
- FR-022: Normalize `ctwa_clid`, source type/id/url, headline/body/media metadata when present.
- FR-023: Represent attribution as immutable touches rather than overwriting a single “last source” field.
- FR-024: Add optional Marketing API enrichment with explicit source/version/retrievedAt.
- FR-025: Store campaign/ad-set/ad IDs and names only when returned by a trusted lookup/mapping.
- FR-026: Expose first-touch, last-touch, and conversion-bound attribution views.

### Meta conversion delivery
- FR-027: Extend current conversion event model with deterministic business-event key.
- FR-028: Store provider request fingerprint, response code/classification, attempt count, first/last attempt timestamps.
- FR-029: Add retry classification and bounded exponential backoff.
- FR-030: Add dead-letter state and privileged replay endpoint/UI.
- FR-031: Replay MUST retain the original business event ID while creating a new delivery attempt.
- FR-032: Expose conversion delivery status through public/admin API.

### WordPress/CRM sync
- FR-033: Add signed outbound webhook topic family `crm.*`.
- FR-034: Provide HMAC SHA-256 signatures with timestamp and replay window.
- FR-035: Provide inbound idempotent contact/deal/event upsert API.
- FR-036: Support `externalSystem`, `externalId`, `sourceVersion`, `idempotencyKey`.
- FR-037: Define conflict strategy per mapped field: chatbotx_owner, external_owner, newest_version, manual_only.
- FR-038: Provide reference adapter documentation for WordPress + FluentCRM.
- FR-039: Provide WooCommerce reference event mappings: order.created, order.paid, order.refunded, order.cancelled.
- FR-040: Never require a WordPress credential in the frontend bundle.

### Sales pipeline
- FR-041: Add Pipeline, PipelineStage, Deal, DealActivity entities.
- FR-042: Deal MUST be workspace-scoped and contact-linked.
- FR-043: Deal stage/status changes emit event-bus events.
- FR-044: Deal changes are usable as flow triggers and sequence stop conditions.
- FR-045: Deal source can reference an AttributionTouch.
- FR-046: Won/Lost changes can trigger existing Meta conversion rules.
- FR-047: Add Kanban/list views and owner filters.
- FR-048: Add inbox/contact sidebar deal summary.

### Audience sync
- FR-049: Add provider-neutral AudienceSync definition.
- FR-050: Add Meta Custom Audience adapter behind explicit workspace feature flag.
- FR-051: Require `ads_audience` permission independent of WhatsApp marketing permission.
- FR-052: Add incremental add/remove jobs with provider rate-limit handling.
- FR-053: Store provider membership outcome, not raw unhashed matching payloads.

### Ops/security
- FR-054: Verify Meta webhook signatures according to current provider contract.
- FR-055: Add replay protection/idempotency for inbound webhooks.
- FR-056: Add bounded payload/body size and rate limiting to external endpoints.
- FR-057: Emit structured metrics for webhook, sequence, CAPI and CRM sync paths.
- FR-058: PII-sensitive fields MUST be redacted from default logs.
- FR-059: Admin replay/mutation actions MUST be audited.
- FR-060: All new queries and unique constraints MUST include workspace scope where applicable.

## Non-Functional Requirements

- NFR-001: 1,000 CTWA leads/month and 4 nurture messages/lead MUST run comfortably on a single production worker tier with headroom of at least 10x message volume in load tests.
- NFR-002: Webhook acknowledgement path p95 < 500ms excluding provider/network latency; heavy work moves to queues.
- NFR-003: Duplicate provider webhook delivery MUST not create duplicate contacts, consent events, sequence sends, deals, or conversion events.
- NFR-004: A worker restart at any point MUST not lose scheduled sequence work.
- NFR-005: No cross-workspace data may be returned or mutated in automated tenancy tests.
- NFR-006: Database migrations MUST support rolling deployment compatibility for at least one application version window.
- NFR-007: Security-sensitive and policy gates require unit + integration + E2E tests.

## Success Metrics

- 100% of marketing sends have an explainable consent decision.
- 0 duplicate WhatsApp nurture sends in retry/failure test suite.
- 100% CTWA conversion events can be traced from deal/outcome → attribution evidence → CAPI delivery ledger.
- <1% unexplained sync failures in soak tests; all failures visible and replayable.
- No unofficial WhatsApp transport used by the official growth profile.
