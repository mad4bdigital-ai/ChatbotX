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

## Fourth integration slice — Workspace Token social statistics

- **novawebs:** Instagram, Facebook and TikTok account/page analytics from connected integration credentials, exposed as three GET routes under /v1/social-stats.
- This adaptation uses the current analytics-scoped token middleware rather than the fork's old token middleware, and selects the workspace solely from the verified token context.
- Query periods are limited to 1–90 days. Instagram and Facebook media snapshots are limited to the newest 100 posts returned by the provider API; these are not exhaustive lifetime totals.
- Per-media Instagram insights calls use bounded batches of at most five concurrent calls. Insights requiring ungranted OAuth scopes are reported unavailable rather than claiming their availability.
- This code does **not** add OAuth permissions or modify connected live accounts; older authorizations may lack analytics permission and return reduced data.
- Added route tests verify the analytics scope, workspace boundary, and invalid-date-window rejection (7/7 passed). Existing Instagram/Messenger provider regression suites passed (720/720 tests), and Builder/Instagram/Messenger scoped TypeScript checks passed. Still draft pending GitHub CI and real-provider smoke tests.

## Fifth integration slice — External Request JSON hygiene

- **Fibrazo:** Ported selective unresolved-variable omission for JSON request body properties to both the Flow Builder test action and the actual Worker execution. The shared helper belongs to the existing business external-request module and carries no remote call or new secrets.
- **Safer than fork code:** Only string values containing unresolved template tokens are omitted; resolved intentional empty strings, null, false and numeric zero are preserved. Object-valued entries in arrays are processed recursively, while the array's own positions remain stable. Malformed JSON is not silently converted into a different payload.
- **Existing safeguards retained:** We did not port the fork's unrelated HTTP 4xx/5xx response behavior change, and the existing request authorization and upstream error normalization are untouched.
- The focused helper, Worker interpolation and Builder preview suites passed 14/14 tests. Full CI and runtime smoke checks are still needed.

## Sixth integration slice — Facebook comment post picker freshness

- **alvanr:** The Facebook post picker now refreshes when reopened instead of reusing the provider's stale mount-time snapshot.
- The adapted store shares the existing initializer and refresh logic, avoids simultaneous API calls when the dialog opens during provider initialization, and preserves the last successful list on provider errors.
- No post selection is automatically changed. Workspace id remains required for the provider store. Three focused refresh/retry/concurrency tests passed.
- No publishing, external write call, or provider-account mutation occurs during the tests.

## Seventh integration slice — Instagram media categorization

- **alvanr:** Preserve the provider media_type in the Instagram comment automation media response and classify REELS and CLIPS consistently in the post picker.
- **Semantic adaptation:** Graph may label ordinary feed videos as media_type VIDEO. The current core deliberately leaves FEED videos in the published tab even when VIDEO; media_type fallback is used only when media_product_type is absent. This prevents incorrectly hiding Feed media during automation setup.
- The existing account/Workspace scoping and Instagram login/Facebook variant APIs are unchanged; we intentionally did not import automatic cross-variant fallback because it requires channel authorization and ID-scoping review.
- Seven focused existing/new Instagram picker tests passed locally. Needs Builder typecheck and full GitHub CI.

## Eighth integration slice — External Request dialog trigger semantics

- Fibrazo: Ported nativeButton=false to the Flow Builder External Request dialog trigger because its rendered element is already a div containing a Button. This aligns it with other dialog triggers in current main and avoids a native-button wrapper around custom markup.
- Four existing callApi registration tests pass when run from the Builder package directory. Builder type checks and GitHub CI are required before merge.

## Fork reconciliation ledger

The machine-readable [community-fork-reconciliation.json](./community-fork-reconciliation.json) tracks all 407 fork-file-change occurrences. **Integrated means selected behavior was ported; it never promises that every upstream hunk was copied.** Pending and partially overlapping paths require separate semantic review. Existing public IG comment and flow APIs are intentionally not copied, since the current main implements more complete scoped interfaces. License bypasses and environment-specific deployment assets are excluded.

## Deliberately not ported / safety notes

- **alvanr Telegram username:** upstream `IncomingContact` contract has no `username` field. Direct transplant fails TS2353. Needs a signed-off field mapping and schema change.
- **alvanr Gemini fallback:** do not import unofficial model identifiers or broad provider-error fallbacks without upstream verification.
- **alvanr manual inbox poll:** a per-workspace UI action must not enqueue an unscoped globally scheduled job without rate limiting and queue/tenant safety.
- **chatplus:** forced rebranding to "ChatPLUS" is inapplicable; Full Russian/Uzbek user-interface localization remains deferred pending complete translation and locale-contract review.
- **novawebs:** Social Stats routes are now integrated with analytics-scoped Workspace Token APIs. Provider OAuth permission upgrades and real-account reauthorization remain deferred; added TikTok helper functions do not automatically grant new scopes.
- **fibrazo:** production CI/deployment scripts and instance-specific Docker compose files are not portable. Do not overwrite current Coolify/VPS infrastructure.
- **mu:** public call link accepts only validated phone numbers; it must not be treated as identity proof or contact consent.

## Source delta governance — automated check

- Source fork changes are not blindly cherry-picked. Six risk decisions were explicitly recorded: reject the old Redis group-creation recovery because its start-from-latest cursor can lose queued messages; defer cross-automation keyword/catchall prioritization pending a policy with replay/idempotency tests; and defer Russian, Uzbek and Mongolian UI activation until those translation dictionaries match the current English source.
- The ledger records all 407 source file-change occurrences, with path-level dispositions, manual-review markers, aggregate counts, and one reason per source. It now reports 37 specifically reviewed entries, which is not the same as 35 complete features.
- New read-only source-control gate: standalone Node checker in scripts/check-community-fork-reconciliation.mjs plus five unit tests in scripts/__tests__/. The dedicated workflow runs them on related PR changes, without secrets, repository write permissions, server access, or production deployment.

## Ninth integration slice — Automated Response keyword descriptions

- alvanr: Ported existing translated descriptions to inbound (contact message) and outbound (Page reply) keyword automation cards. No change to automated response dispatch, authorization, or rule configuration.
- Both translation keys already exist in every enabled locale, so this adds no new untranslated messages.
- Existing keyword automation tests passed 18 of 18, and the scoped Builder TypeScript check passed.

## Tenth integration slice — AI Functions discoverability

- **alvanr:** Added AI Functions as a native tool card linking to the existing workspace-scoped AI Functions page. Uses the existing localization keys and the current Tools page's permission/visibility architecture; no Gemini fallback model, unofficial provider integration, or new credential handling.
- Both Tools configuration and rendered navigation tests passed (29/29). Scoped Builder typecheck and full GitHub CI are required before merge.

## Next slices

1. WordPress / WooCommerce / FluentCRM adapter separately from ChatbotX core, using contract-first APIs.
2. Compare the 55 overlapping paths semantically; preserve current main behavior for auth, billing, and worker.
3. Classify all other changes from the five forks as duplicate, superseded, compatible, needs-adaptation, or incompatible, with per-path evidence in the source archive.
4. Add tests for external API failures, authorization, and rate limits; rerun repo-wide checks and a deployment rehearsal on a non-production endpoint.
5. Review PR #1 on its own merits, especially WhatsApp send authorization, stop-on-reply lifecycle, and CI failures.

**Explicit rejection:** Fibrazo changes that bypass enterprise-license verification are not integrated.

**Release rule:** no merge into main, no production deployment, and no silent "ours/theirs" preference. Draft PR only until full CI and safety gates pass.
