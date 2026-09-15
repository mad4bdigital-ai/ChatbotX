# ChatbotX Growth CRM Gap-Closure Constitution

## Purpose

This constitution governs brownfield changes that extend ChatbotX into a production-grade WhatsApp growth CRM for Meta Click-to-WhatsApp acquisition while preserving upstream compatibility, tenant safety, and the Community Edition license boundary.

## Principles

### I. Official WhatsApp Business Platform Only
For the WhatsApp growth/CRM profile, implementation MUST use Meta WhatsApp Cloud API semantics and MUST NOT introduce QR-session, Baileys, WhatsApp Web emulation, or undocumented messaging transports. Provider abstractions may remain, but compliance-sensitive features MUST fail closed if the active channel is not an official Cloud API integration.

### II. Consent Is Channel-, Purpose-, and Evidence-Specific
A generic subscribed flag is insufficient for marketing authorization. Marketing consent MUST record channel, purpose, status, captured/revoked timestamps, source, consent-text version, actor, and evidence metadata. Sending a marketing template, broadcast, or sequence step MUST pass a centralized consent policy gate. Consent history MUST be append-only/auditable even when a materialized current status is maintained for fast reads.

### III. Attribution Must Preserve Source Evidence
CTWA attribution MUST preserve raw referral evidence before normalization. `ctwa_clid`, ad/source identifiers, referral payloads, and any Marketing API enrichment MUST be distinguishable. The system MUST NOT fabricate campaign/ad-set/ad identity when Meta did not provide or resolve it. Enrichment failure MUST not destroy the original attribution evidence.

### IV. Automation Must Be Durable, Idempotent, and Interruptible
Long-running sequences MUST survive worker restarts, deploys, retries, and transient provider failures. Every scheduled send and conversion delivery MUST be idempotent. Inbound replies, opt-outs, blocks, deal-state changes, and policy changes MUST be able to stop or pause pending automation without racing queued jobs.

### V. Closed-Loop Meta Feedback Must Be Traceable
Qualified/Won/Purchase events sent to Meta MUST have deterministic event IDs, explicit identity/attribution prerequisites, retry policy, delivery attempt history, and dead-letter/replay support. A UI/API status MUST distinguish accepted, skipped, failed, retriable, permanently failed, and replayed deliveries.

### VI. One Source of Truth Per Domain
ChatbotX owns messaging state, conversation state, channel attribution, and sequence execution. An external CRM/WordPress integration MAY own customer/profile or commerce fields, but field ownership MUST be declared. Bi-directional sync MUST use version/idempotency keys and MUST not create infinite update loops.

### VII. Tenant Isolation, Least Privilege, and PII-Minimized Observability
Every new table, query, queue payload, webhook, and API MUST be workspace-scoped. Secrets MUST never be logged. Logs and traces MUST minimize phone numbers, message bodies, tokens, and raw PII. External webhooks MUST support signature verification, replay protection, rate limiting, and bounded payload sizes.

### VIII. Brownfield Compatibility and License Boundaries
Changes MUST extend existing Community Edition architecture rather than bypass it. Code under `apps/builder/src/enterprise` is outside this feature scope unless separately licensed/authorized. Existing APIs and data MUST remain backward compatible unless a migration plan and explicit breaking-change approval exist. Database migrations MUST be forward-only and reversible operationally via documented rollback procedures.

### IX. Evidence Before Merge
Every P0/P1 requirement MUST have automated tests at the appropriate layer plus an end-to-end acceptance path. CI MUST cover migrations, lint/type/build, worker behavior, policy gates, webhook security, retry/idempotency, and failure paths. “Implemented” means the acceptance evidence exists, not merely that code paths compile.

## Governance

- This constitution applies to `001-whatsapp-growth-crm-gap-closure` and successor specs that modify these domains.
- Amendments require an explicit constitution diff and rationale in the feature plan.
- Priority order when requirements conflict: security/compliance > data integrity > attribution correctness > reliability > UX convenience.
- The base upstream SHA for this spec is `3196f01dd2027279016fb180c48764e128669483`.
- Version: 1.0.0
- Ratified: 2026-09-13
