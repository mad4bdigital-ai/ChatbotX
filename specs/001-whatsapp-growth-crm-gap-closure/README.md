# 001 — WhatsApp Growth CRM Gap Closure

**Target branch:** `001-whatsapp-growth-crm-gap-closure`  
**Upstream repository:** `ChatbotXIO/ChatbotX`  
**Base SHA:** `3196f01dd2027279016fb180c48764e128669483`  
**Intent:** extend current Community Edition capabilities without duplicating features already present.

## Baseline already present at the base SHA

- Visual Flow Builder and WhatsApp message steps.
- WhatsApp Cloud API integration.
- Sequences, sequence subscribe/unsubscribe flow steps, broadcasts, and live inbox.
- Contact CRM, tags/custom fields/segmentation.
- Generic `subscribedAt` / `broadcastSubscribedAt` contact fields.
- CTWA attribution/CAPI code paths including `ctwaClid` gates and conversion-delivery logic.
- Public API, webhooks/HTTP actions, queues/workers, PostgreSQL/Redis.

## Gaps this spec closes

1. WhatsApp-specific marketing consent registry and policy enforcement.
2. Durable long-running sequence lifecycle with stop-on-reply, pause/resume, re-entry policy, quiet hours, and template/consent checks.
3. Complete CTWA evidence retention + optional Marketing API enrichment while preserving raw referral data.
4. Production-grade Meta conversion feedback with deterministic dedupe, delivery ledger, replay/dead-letter support, and visible status.
5. First-class WordPress/FluentCRM/WooCommerce integration contract with signed events and field ownership.
6. Optional native sales pipeline/deals layer so ChatbotX can cover more of the Kommo/WATI use case without requiring a second CRM.
7. Privacy-safe Meta audience/retargeting sync as an opt-in, separately permissioned capability.
8. Operational hardening: tenant isolation, audit log, observability, backup/recovery documentation, and load/failure tests.
