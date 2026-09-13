# Requirements Quality Checklist

- [x] Baseline exact SHA recorded.
- [x] Existing native CTWA/CAPI/sequence capabilities are not specified as greenfield work.
- [x] Official Cloud API requirement is explicit.
- [x] WhatsApp consent and ads-audience permission are distinct.
- [x] Consent source/text-version/evidence is specified.
- [x] Stop-on-reply and long-running durability are acceptance requirements.
- [x] Raw attribution evidence and derived enrichment are separated.
- [x] CAPI idempotency/retry/replay/dead-letter semantics are specified.
- [x] WordPress is optional and contract-based.
- [x] Sales pipeline scope is bounded.
- [x] Tenant isolation and PII logging constraints are explicit.
- [x] Enterprise-license directory is excluded from required Community Edition changes.
- [x] Operational/load/failure acceptance exists.
- [ ] Before implementation: inspect all current sequence send entry points and characterize behavior.
- [ ] Before implementation: validate current Meta Graph/CAPI schema/version against live official docs.
- [ ] Before implementation: confirm migration policy for existing `broadcastSubscribedAt` workspaces.
