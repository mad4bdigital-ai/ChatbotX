# ChatbotX community fork consolidation (source collection)

Date: 2026-10-27  
Base: [mad4bdigital-ai/ChatbotX](https://github.com/mad4bdigital-ai/ChatbotX) `main` at `1ad445ae91a104e9c978a909cc58eccb5ea344d0`.  
Branch: `integration/community-forks-2026-10-27`

## Scope

This branch preserves **all 407 changed-file occurrences** found in the five selected public forks: **402 added/modified file contents**, plus **5 deletion records**. The source revisions are pinned, including **55 overlapping file paths**.

**This is a lossless source collection, NOT a merged or release-ready ChatbotX application.** Code under `.community-forks/deltas/<fork-id>/` is stored separately to preserve competing implementations; it is not wired into the root runtime. No cherry-pick, conflict resolution, compatibility certification, or CI pass is implied. Do not deploy this branch.

| ID | Repository | Source branch | Exact head | Changed occurrences |
| --- | --- | --- | --- | ---: |
| `alvanr` | [alvanr-git/ChatbotX](https://github.com/alvanr-git/ChatbotX) | `main` | `7fb68e45aa9228aceb55658a2e6d1ba57ca44b7a` | 121 |
| `chatplus` | [khan-umirzakoff/ChatbotX-Fork-ChatPlus](https://github.com/khan-umirzakoff/ChatbotX-Fork-ChatPlus) | `chatplus` | `6372b9cea903b0f47c7f6e39b528d80d81531b3a` | 54 |
| `novawebs` | [novawebsdenia-wq/chatbotx-novawebs](https://github.com/novawebsdenia-wq/chatbotx-novawebs) | `main` | `86efd089bdba68d6eeff737a4bd21a3583157527` | 30 |
| `mu-chatbotx` | [Hitoshidattebayo/Mu---ChatbotX](https://github.com/Hitoshidattebayo/Mu---ChatbotX) | `main` | `f9eb1f4db479c5dce165286d083840345b7072c0` | 105 |
| `fibrazo` | [Fibrazo-SAS/ChatbotX](https://github.com/Fibrazo-SAS/ChatbotX) | `main` | `62413ef8126d9ea592aa8ec242c83d30c6baa174` | 97 |

## Deletions preserved as intent (not applied to root)
- `alvanr`: `apps/builder/__tests__/minigame-name-conflict-action.test.ts`
- `alvanr`: `apps/builder/__tests__/minigame-player-settings-reset-policy.test.ts`
- `alvanr`: `apps/builder/__tests__/minigame-share-url.test.ts`
- `alvanr`: `apps/builder/src/app/minigames/page.tsx`
- `alvanr`: `packages/business/__tests__/resolve-minigame-prize.test.ts`

## Next integration steps

1. Keep `main` and existing PR #1 untouched. Review provenance and all changes in `MANIFEST.json`.
2. Diff each candidate against the current root, identify upstream-equivalent changes and overlapping paths; never resolve conflicts with blanket `ours` or `theirs`.
3. Integrate in small thematic commits (messaging, flows, branding, integrations, CI) with test coverage and retained original license/attributions.
4. Run lint, unit tests, type checks, migrations review, and integration smoke tests before proposing any merge.
5. Open a **draft** PR only when actual integration changes exist. No production deployment by this source collection.

## Provenance

Original source: [ChatbotXIO/ChatbotX](https://github.com/ChatbotXIO/ChatbotX). Source forks have independent contributions; check each project's license and individual file history before redistribution or production usage. This collection does not grant rights beyond their applicable licenses.
