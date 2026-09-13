# Acceptance Quickstart

## Canonical E2E scenario

1. Create workspace and official WhatsApp Cloud API integration.
2. Create CTWA test ad/referral fixture with `ctwa_clid`.
3. Send inbound WhatsApp message carrying referral metadata.
4. Assert Contact + ContactInbox + AttributionTouch exist and raw referral is preserved.
5. Run bot qualification flow.
6. Grant WhatsApp `marketing` consent through flow action; assert current state + immutable event history.
7. Enroll in a 60-day sequence with immediate + Day1 + Day3 + Day7 steps.
8. Execute immediate step.
9. Advance virtual clock to Day1; verify approved template policy and one idempotent send.
10. Send inbound reply before Day3; assert enrollment becomes `stopped_reply` and Day3/Day7 jobs do not send.
11. Re-enroll only if configured re-entry policy permits.
12. Create Deal, move to Qualified then Won.
13. Assert deterministic conversion event and Meta delivery attempt ledger.
14. Simulate Meta 500 then success; verify retry without duplicate business event.
15. Configure WordPress adapter endpoint; emit signed `crm.deal.won` / `crm.contact.updated` events.
16. Replay the same inbound WordPress event; verify no duplicate contact/deal/update loop.
17. Revoke WhatsApp marketing consent; assert any new marketing send is denied immediately.

## Security acceptance

- Invalid HMAC/signature is rejected.
- Old timestamp/replayed request is rejected or idempotently acknowledged according to contract.
- Cross-workspace IDs cannot read/mutate another workspace.
- Logs do not contain access tokens or unredacted provider responses containing PII.

## CI commands

Run repository-standard commands plus feature tests:

```bash
pnpm lint
pnpm build
pnpm check:circular
pnpm check:unused
# Add package-level/unit/integration/E2E test commands according to the repo's current scripts.
```
