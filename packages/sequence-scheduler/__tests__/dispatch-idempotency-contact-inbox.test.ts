import { describe, expect, test } from "vitest"
import { generateIdempotencyKey } from "../src/dispatch-manager"

describe("sequence dispatch idempotency identity", () => {
  test("keeps the legacy four-argument key stable", () => {
    const runAt = new Date("2026-09-13T12:00:00.000Z")

    expect(
      generateIdempotencyKey("ws-1", "enroll-1", "step-1", runAt),
    ).toBe(`ws-1:enroll-1:step-1:${runAt.toISOString()}`)
  })

  test("distinguishes two ContactInboxes for the same enrollment step and run time", () => {
    const runAt = new Date("2026-09-13T12:00:00.000Z")

    const inboxA = generateIdempotencyKey(
      "ws-1",
      "enroll-1",
      "step-1",
      runAt,
      "contact-inbox-a",
    )
    const inboxB = generateIdempotencyKey(
      "ws-1",
      "enroll-1",
      "step-1",
      runAt,
      "contact-inbox-b",
    )

    expect(inboxA).toBe(
      `ws-1:enroll-1:step-1:contact-inbox-a:${runAt.toISOString()}`,
    )
    expect(inboxB).toBe(
      `ws-1:enroll-1:step-1:contact-inbox-b:${runAt.toISOString()}`,
    )
    expect(inboxA).not.toBe(inboxB)
  })

  test("remains deterministic for retries of the same ContactInbox dispatch", () => {
    const firstRunAt = new Date("2026-09-13T12:00:00.000Z")
    const sameRunAt = new Date(firstRunAt.getTime())

    expect(
      generateIdempotencyKey(
        "ws-1",
        "enroll-1",
        "step-1",
        firstRunAt,
        "contact-inbox-a",
      ),
    ).toBe(
      generateIdempotencyKey(
        "ws-1",
        "enroll-1",
        "step-1",
        sameRunAt,
        "contact-inbox-a",
      ),
    )
  })
})
