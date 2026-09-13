import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  enrollmentFindFirst: vi.fn(),
  nextStepLimit: vi.fn(),
  transaction: vi.fn(),
  hasBlockingSiblingDispatches: vi.fn(),
  claimEnrollmentCompleted: vi.fn(),
  claimEnrollmentNextStep: vi.fn(),
}))

vi.mock("../src/advance-enrollment-state", () => ({
  hasBlockingSiblingDispatches: (...args: unknown[]) =>
    mocks.hasBlockingSiblingDispatches(...args),
  claimEnrollmentCompleted: (...args: unknown[]) =>
    mocks.claimEnrollmentCompleted(...args),
  claimEnrollmentNextStep: (...args: unknown[]) =>
    mocks.claimEnrollmentNextStep(...args),
}))

vi.mock("../src/contacts-on-sequences", () => ({
  getContactInboxes: vi.fn(),
}))

vi.mock("../src/dispatch-manager", () => ({
  createDispatch: vi.fn(),
}))

vi.mock("../src/calculate-next-run-at", () => ({
  calculateNextRunAtFromStep: vi.fn(),
}))

vi.mock("../src/send-time-validator", () => ({
  calculateNextValidSendTime: vi.fn(),
}))

vi.mock("@chatbotx.io/database/client", () => ({
  db: {
    query: {
      contactsOnSequenceModel: {
        findFirst: (...args: unknown[]) => mocks.enrollmentFindFirst(...args),
      },
    },
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => ({
            limit: (...args: unknown[]) => mocks.nextStepLimit(...args),
          }),
        }),
      }),
    }),
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
  and: (...args: unknown[]) => ({ __and: args }),
  eq: (column: unknown, value: unknown) => ({ __eq: [column, value] }),
  asc: (column: unknown) => ({ __asc: column }),
  gt: (column: unknown, value: unknown) => ({ __gt: [column, value] }),
}))

vi.mock("@chatbotx.io/database/schema", () => ({
  contactsOnSequenceModel: {},
  sequenceStepModel: {
    sequenceId: "step.sequenceId",
    order: "step.order",
    isActive: "step.isActive",
  },
}))

import { advanceEnrollment } from "../src/advance-enrollment"
import { calculateNextRunAtFromStep } from "../src/calculate-next-run-at"
import { getContactInboxes } from "../src/contacts-on-sequences"
import { createDispatch } from "../src/dispatch-manager"
import { calculateNextValidSendTime } from "../src/send-time-validator"

const SENT_AT = new Date("2026-09-13T12:00:00Z")
const NEXT_RUN_AT = new Date("2026-09-14T09:00:00Z")
const NEXT_STEP = {
  id: "step-2",
  order: 1,
  delayDays: 1,
  delayMinutes: 0,
  delayUnit: null,
  specificDateTime: null,
  anytime: true,
  sendTimeStart: null,
  sendTimeEnd: null,
  sendDays: null,
}

function activeEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: "enrollment-1",
    workspaceId: "ws-1",
    sequenceId: "seq-1",
    contactId: "contact-1",
    status: "active",
    lastStepId: null,
    nextStepId: "step-1",
    currentStep: 0,
    ...overrides,
  }
}

function params(
  overrides: Partial<Parameters<typeof advanceEnrollment>[0]> = {},
): Parameters<typeof advanceEnrollment>[0] {
  return {
    enrollmentId: "enrollment-1",
    workspaceId: "ws-1",
    sequenceId: "seq-1",
    contactId: "contact-1",
    currentStep: { id: "step-1", order: 0 },
    sentAt: SENT_AT,
    scheduler: { addToSchedule: vi.fn() } as unknown as Parameters<
      typeof advanceEnrollment
    >[0]["scheduler"],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.enrollmentFindFirst.mockResolvedValue(activeEnrollment())
  mocks.nextStepLimit.mockResolvedValue([])
  mocks.hasBlockingSiblingDispatches.mockResolvedValue(false)
  mocks.claimEnrollmentCompleted.mockResolvedValue(true)
  mocks.claimEnrollmentNextStep.mockResolvedValue(true)
  mocks.transaction.mockImplementation(
    async (callback: (tx: Record<string, unknown>) => Promise<unknown>) =>
      await callback({ __tx: true }),
  )
  vi.mocked(getContactInboxes).mockResolvedValue([
    { id: "inbox-1" },
  ] as unknown as Awaited<ReturnType<typeof getContactInboxes>>)
  vi.mocked(createDispatch).mockResolvedValue({
    id: "dispatch-2",
    bucket: 7,
    runAtMs: String(NEXT_RUN_AT.getTime()),
  })
  vi.mocked(calculateNextRunAtFromStep).mockReturnValue(NEXT_RUN_AT)
  vi.mocked(calculateNextValidSendTime).mockImplementation((date) => date)
})

describe("advanceEnrollment", () => {
  test("throws when enrollment no longer exists", async () => {
    mocks.enrollmentFindFirst.mockResolvedValueOnce(undefined)

    await expect(
      advanceEnrollment(params({ enrollmentId: "missing" })),
    ).rejects.toThrow("Enrollment missing not found")
  })

  test("returns without touching the barrier when enrollment is not active", async () => {
    mocks.enrollmentFindFirst.mockResolvedValueOnce(
      activeEnrollment({ status: "paused" }),
    )

    await advanceEnrollment(params())

    expect(mocks.hasBlockingSiblingDispatches).not.toHaveBeenCalled()
  })

  test("returns when the current step was already recorded as lastStepId", async () => {
    mocks.enrollmentFindFirst.mockResolvedValueOnce(
      activeEnrollment({ lastStepId: "step-1" }),
    )

    await advanceEnrollment(params())

    expect(mocks.hasBlockingSiblingDispatches).not.toHaveBeenCalled()
  })

  test("returns for a stale or out-of-order dispatch whose step no longer owns nextStepId", async () => {
    mocks.enrollmentFindFirst.mockResolvedValueOnce(
      activeEnrollment({ nextStepId: "step-2" }),
    )

    await advanceEnrollment(params())

    expect(mocks.hasBlockingSiblingDispatches).not.toHaveBeenCalled()
  })

  test("waits for sibling ContactInbox dispatches before advancing", async () => {
    mocks.hasBlockingSiblingDispatches.mockResolvedValueOnce(true)

    await advanceEnrollment(params())

    expect(mocks.hasBlockingSiblingDispatches).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "step-1",
    })
    expect(mocks.nextStepLimit).not.toHaveBeenCalled()
    expect(mocks.claimEnrollmentCompleted).not.toHaveBeenCalled()
    expect(mocks.claimEnrollmentNextStep).not.toHaveBeenCalled()
  })

  test("atomically completes the enrollment when no next active step exists", async () => {
    mocks.nextStepLimit.mockResolvedValueOnce([])

    await advanceEnrollment(params())

    expect(mocks.claimEnrollmentCompleted).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      currentStepId: "step-1",
      currentStepOrder: 0,
      sentAt: SENT_AT,
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  test("does not create next-generation dispatches when another sibling wins the CAS", async () => {
    mocks.nextStepLimit.mockResolvedValueOnce([NEXT_STEP])
    mocks.claimEnrollmentNextStep.mockResolvedValueOnce(false)

    await advanceEnrollment(params())

    expect(mocks.claimEnrollmentNextStep).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createDispatch)).not.toHaveBeenCalled()
  })

  test("creates exactly one next-step dispatch per ContactInbox after winning the CAS", async () => {
    mocks.nextStepLimit.mockResolvedValueOnce([NEXT_STEP])
    vi.mocked(getContactInboxes).mockResolvedValueOnce([
      { id: "inbox-1" },
      { id: "inbox-2" },
    ] as unknown as Awaited<ReturnType<typeof getContactInboxes>>)

    await advanceEnrollment(params())

    expect(mocks.claimEnrollmentNextStep).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        currentStepId: "step-1",
        nextStepId: "step-2",
        nextStepOrder: 1,
        nextRunAt: NEXT_RUN_AT,
      }),
    )
    expect(vi.mocked(createDispatch)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(createDispatch)).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ contactInboxId: "inbox-1", stepId: "step-2" }),
    )
    expect(vi.mocked(createDispatch)).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ contactInboxId: "inbox-2", stepId: "step-2" }),
    )
  })

  test("schedules the new generation only after the database transaction returns", async () => {
    mocks.nextStepLimit.mockResolvedValueOnce([NEXT_STEP])
    const order: string[] = []
    mocks.transaction.mockImplementationOnce(
      async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const result = await callback({ __tx: true })
        order.push("transaction-committed")
        return result
      },
    )
    const scheduler = {
      addToSchedule: vi.fn().mockImplementation(() => {
        order.push("scheduled")
      }),
    }

    await advanceEnrollment(
      params({
        scheduler: scheduler as unknown as Parameters<
          typeof advanceEnrollment
        >[0]["scheduler"],
      }),
    )

    expect(order).toEqual(["transaction-committed", "scheduled"])
  })

  test("advances state but creates no dispatch when the contact has no inboxes", async () => {
    mocks.nextStepLimit.mockResolvedValueOnce([NEXT_STEP])
    vi.mocked(getContactInboxes).mockResolvedValueOnce([])

    await advanceEnrollment(params())

    expect(mocks.claimEnrollmentNextStep).toHaveBeenCalledTimes(1)
    expect(vi.mocked(createDispatch)).not.toHaveBeenCalled()
  })
})
