# Acceptance Quickstart v2

## P0 security/correctness acceptance

### A. WhatsApp webhook authenticity
1. Configure a manual official WhatsApp Cloud API integration with app/client secret.
2. POST an exact fixture body with a correct `x-hub-signature-256`; assert expected queue job(s).
3. Replay the exact valid fixture; assert durable message/event effects remain idempotent.
4. POST same body with forged `sha256=deadbeef`; assert 401/403-equivalent rejection and zero queue/database side effects.
5. Test missing/malformed signature and oversized body; assert no processing.

### B. Sequence exact-inbox routing
1. Create one contact with two ContactInboxes in the same workspace.
2. Enroll contact in a sequence with one message-producing flow step.
3. Confirm scheduler creates the intended per-inbox dispatches.
4. Execute one dispatch and assert exactly one `runFlowNode` target: that dispatch's ContactInbox.
5. Retry the same dispatch/job and assert no duplicate message-producing effect.
6. Execute second inbox dispatch and assert it targets only the second inbox.

### C. Reply/consent race
1. Grant explicit WhatsApp marketing consent with source/text-version evidence.
2. Enroll in Day0/Day1/Day3 sequence.
3. Execute Day0.
4. Before Day1 execution, persist a genuine inbound customer reply.
5. Assert relevant active sequence enrollment is stopped/canceled according to policy and pending schedule is removed/suppressed.
6. Force a race where a dispatch reaches execution while reply/opt-out is recorded; execution-time policy must suppress the marketing send.
7. Revoke marketing consent and prove no queued MARKETING step can send.

### D. Time-window semantics
1. Configure a send window and IANA timezone.
2. Test normal day, DST spring-forward and DST fall-back boundaries.
3. Assert no send outside the configured local window.
4. Create an impossible/no-valid-slot schedule and assert explicit paused/failed state rather than fallback send at base time.

## P1 closed-loop acceptance

1. Receive CTWA message; keep latest `ContactInbox.referral` and append immutable AttributionTouch.
2. Qualify lead and create/update Deal.
3. Mark Deal Won and trigger the appropriate existing conversion pipeline/rule.
4. Simulate provider retryable then terminal failure; verify existing retry semantics plus new operator diagnostics/replay where applicable.
5. Replay only an eligible failed event; preserve original business/source identity and audit the replay.
6. Emit signed CRM event to WordPress/FluentCRM/WooCommerce adapter and replay it; assert idempotency/no loop.
7. Sync eligible contact into existing Meta audience adapter, then revoke audience permission/segment eligibility; assert removal/reconciliation.

## Release evidence

```bash
pnpm lint
pnpm build
pnpm check:circular
pnpm check:unused
# plus repository-standard type/test commands for touched workspaces
```

Implementation-ready requires all P0 characterization tests to fail on the vulnerable/incorrect baseline where appropriate and pass after the canonical patch.
