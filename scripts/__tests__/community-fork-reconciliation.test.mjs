import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"
import { validateForkLedger } from "../check-community-fork-reconciliation.mjs"

const REVIEW_CONTRADICTION = /review\/disposition contradiction/
const DUPLICATE_SOURCE = /duplicate fork path/
const COUNT_MISMATCH = /overall_status: count mismatch/
const COUNT_CHANGED = /source entry count changed/

const basePath = resolve("docs/community-fork-reconciliation.json")
const original = JSON.parse(readFileSync(basePath, "utf8"))
const clone = () => structuredClone(original)

test("audits all pinned source fork changes", () => {
  const output = validateForkLedger(clone())
  assert.equal(output.total, 407)
  assert.ok(output.reviewed > 0)
})

test("rejects unreviewed entries promoted to integrated", () => {
  const document = clone()
  const entry = document.entries.find((x) => !x.confirmed_manual)
  entry.disposition = "integrated_runtime"
  assert.throws(() => validateForkLedger(document), REVIEW_CONTRADICTION)
})

test("rejects missing or duplicated source paths", () => {
  const document = clone()
  document.entries[1].fork = document.entries[0].fork
  document.entries[1].path = document.entries[0].path
  assert.throws(() => validateForkLedger(document), DUPLICATE_SOURCE)
})

test("rejects stale aggregate counts", () => {
  const document = clone()
  document.overall_status.pending_feature_integration += 1
  assert.throws(() => validateForkLedger(document), COUNT_MISMATCH)
})

test("rejects forgotten records", () => {
  const document = clone()
  document.entries.pop()
  assert.throws(() => validateForkLedger(document), COUNT_CHANGED)
})
