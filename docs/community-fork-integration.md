# ChatbotX community fork integration — 2026-10-27

**Branch:** feature/community-unified-chatbotx
**Base:** mad4bdigital-ai/ChatbotX main @ `1ad445ae91a104e9c978a909cc58eccb5ea344d0`
**Source inventory:** [integration/community-forks-2026-10-27](https://github.com/mad4bdigital-ai/ChatbotX/tree/integration/community-forks-2026-10-27/.community-forks) in the dedicated source-collection branch. This runtime integration branch does **not** contain copied fork directories.

This is **incremental integration**, not the complete five-fork merge. The reference archive preserves all 407 changed-file occurrences, including 55 overlapping paths. The code integrated here is kept small enough for semantic review, test validation, and cherry-pick rollback.

## Integrated changes

| Source fork (exact head) | Included paths/feature | Verification |
| --- | --- | --- |
| Hitoshidattebayo/Mu---ChatbotX (`f9eb1f4db479c5dce165286d083840345b7072c0`) | Call Phone Number button for Messenger; Instagram safe dial link; flow editor, execution policy, i18n registry adaptation | 11 focused tests; packages flow-config, business, messenger, worker and builder type checks; locale consistency check |
| alvanr-git/ChatbotX (`7fb68e45aa9228aceb55658a2e6d1ba57ca44b7a`) | Defensive Graph cursor pagination for unexpectedly malformed provider data; regression test | Graph pagination suite 10/10, utils types |
| novawebsdenia-wq/chatbotx-novawebs (`86efd089bdba68d6eeff737a4bd21a3583157527`) | TikTok user stats API and owned-video list support without overwriting existing TikTok Business Comment Automation API or its schema | TikTok types; broader integration tests remain |
| Fibrazo-SAS/ChatbotX (`62413ef8126d9ea592aa8ec242c83d30c6baa174`) | Explicit workspace-member role in validated resource schema | Builder types under validation |

| khan-umirzakoff/ChatbotX-Fork-ChatPlus (6372b9cea903b0f47c7f6e39b528d80d81531b3a) | Uzbek contact-language support for live profiles and historical backfill with translation labels; no forced rebrand | Contact-locale and backfill parity tests; scoped TS |

## Deliberately not ported / safety notes

- **alvanr Telegram username:** upstream `IncomingContact` contract has no `username` field. Direct transplant fails TS2353. Needs a signed-off field mapping and schema change.
- **alvanr Gemini fallback:** do not import unofficial model identifiers or broad provider-error fallbacks without upstream verification.
- **alvanr manual inbox poll:** a per-workspace UI action must not enqueue an unscoped globally scheduled job without rate limiting and queue/tenant safety.
- **chatplus:** forced rebranding to "ChatPLUS" is inapplicable; Full Russian/Uzbek user-interface localization remains deferred pending complete translation and locale-contract review.
- **novawebs:** Social Stats routes and all OAuth scope requirements have not been integrated or activated. Added TikTok helper functions alone do not grant TikTok scopes.
- **fibrazo:** production CI/deployment scripts and instance-specific Docker compose files are not portable. Do not overwrite current Coolify/VPS infrastructure.
- **mu:** public call link accepts only validated phone numbers; it must not be treated as identity proof or contact consent.

## Next slices

1. WordPress / WooCommerce / FluentCRM adapter separately from ChatbotX core, using contract-first APIs.
2. Compare the 55 overlapping paths semantically; preserve current main behavior for auth, billing, and worker.
3. Classify all other changes from the five forks as duplicate, superseded, compatible, needs-adaptation, or incompatible, with per-path evidence in the source archive.
4. Add tests for external API failures, authorization, and rate limits; rerun repo-wide checks and a deployment rehearsal on a non-production endpoint.
5. Review PR #1 on its own merits, especially WhatsApp send authorization, stop-on-reply lifecycle, and CI failures.

**Release rule:** no merge into main, no production deployment, and no silent "ours/theirs" preference. Draft PR only until full CI and safety gates pass.
