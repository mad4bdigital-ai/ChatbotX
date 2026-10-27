#!/usr/bin/env node
/**
 * Verify that the five-source fork reconciliation ledger cannot silently lose
 * an entry, change its disposition without updating counts, or report an
 * unreviewed source edit as an integrated implementation.
 *
 * Deliberately read-only: no network, filesystem writes or production access.
 */
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const expectedForks = new Set([
  "alvanr",
  "chatplus",
  "novawebs",
  "mu-chatbotx",
  "fibrazo",
])
const dispositions = new Set([
  "pending_feature_integration",
  "pending_upstream_conflict",
  "pending_semantic_conflict",
  "partial_overlap_review",
  "deferred_environment_specific",
  "deferred_branding",
  "deferred_delete",
  "deferred_translation_parity",
  "integrated_runtime",
  "integrated_adapted",
  "superseded_by_current_main",
  "excluded_security_or_license",
])
const reviewedStatuses = new Set([
  "integrated_runtime",
  "integrated_adapted",
  "superseded_by_current_main",
  "excluded_security_or_license",
])

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function verifyCounts(actual, expected, label) {
  const normalize = (value) =>
    Object.fromEntries(
      Object.entries(value ?? {})
        .filter(([, count]) => count !== 0)
        .sort(),
    )
  assert(
    JSON.stringify(normalize(actual)) === JSON.stringify(normalize(expected)),
    `${label}: count mismatch`,
  )
}

export function validateForkLedger(doc) {
  assert(doc?.schema_version === 1, "unsupported ledger version")
  assert(
    doc.base_sha === "1ad445ae91a104e9c978a909cc58eccb5ea344d0",
    "unexpected pinned base SHA",
  )
  assert(Array.isArray(doc.entries), "entries must be an array")
  assert(
    doc.total_occurrences === 407,
    "total_occurrences must preserve source audit: 407",
  )
  assert(
    doc.entries.length === 407,
    "source entry count changed without source migration",
  )
  const seen = new Set()
  const totals = {}
  const countsByFork = Object.fromEntries(
    [...expectedForks].map((fork) => [fork, {}]),
  )
  for (const [i, entry] of doc.entries.entries()) {
    assert(expectedForks.has(entry.fork), `entry ${i}: unknown fork`)
    assert(
      typeof entry.path === "string" && entry.path.length > 0,
      `entry ${i}: missing path`,
    )
    assert(
      !(entry.path.startsWith("/") || entry.path.split("/").includes("..")),
      `entry ${i}: unsafe path`,
    )
    assert(
      !seen.has(`${entry.fork}/${entry.path}`),
      `entry ${i}: duplicate fork path`,
    )
    seen.add(`${entry.fork}/${entry.path}`)
    assert(
      dispositions.has(entry.disposition),
      `entry ${i}: unknown disposition`,
    )
    assert(
      typeof entry.reason === "string" && entry.reason.trim().length > 8,
      `entry ${i}: missing rationale`,
    )
    assert(
      typeof entry.confirmed_manual === "boolean",
      `entry ${i}: missing review flag`,
    )
    assert(
      entry.confirmed_manual === reviewedStatuses.has(entry.disposition),
      `entry ${i}: review/disposition contradiction`,
    )
    totals[entry.disposition] = (totals[entry.disposition] ?? 0) + 1
    const forkCounts = countsByFork[entry.fork]
    forkCounts[entry.disposition] = (forkCounts[entry.disposition] ?? 0) + 1
  }
  verifyCounts(doc.overall_status, totals, "overall_status")
  assert(
    Object.keys(doc.by_fork ?? {}).length === expectedForks.size,
    "expected five source forks",
  )
  for (const fork of expectedForks) {
    verifyCounts(doc.by_fork[fork], countsByFork[fork], `by_fork.${fork}`)
  }
  return {
    total: doc.entries.length,
    reviewed: doc.entries.filter((e) => e.confirmed_manual).length,
    totals,
  }
}

if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${resolve(process.argv[1])}`).href
) {
  const path = resolve(
    process.argv[2] ?? "docs/community-fork-reconciliation.json",
  )
  try {
    const result = validateForkLedger(JSON.parse(readFileSync(path, "utf8")))
    console.log(
      "Community fork ledger verified:",
      result.total,
      "file changes across",
      expectedForks.size,
      "forks;",
      result.reviewed,
      "explicitly reviewed",
    )
  } catch (error) {
    console.error(
      "Community fork ledger verification failed:",
      error instanceof Error ? error.message : error,
    )
    process.exitCode = 1
  }
}
