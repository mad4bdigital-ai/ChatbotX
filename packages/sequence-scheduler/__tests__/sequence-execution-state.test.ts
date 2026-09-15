import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  enrollmentFindFirst: vi.fn(),
  updateSet: vi.fn(),
  updateReturning: vi.fn(),
  transaction: vi.fn(),
  cancelPendingDispatches: vi.fn(),
  removeDispatchesFromSchedule: vi.fn(),
}))

vi.mock("@chatbotx.io/database/client", () => ({
  db: {
    query: {
      contactsOnSequenceModel: {
        findFirst: (...args: unknown[]) => mocks.enrollmentFindFirst(...args),
      },
    },
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
  and: (...args: unknown[]) => ({ __and: args }),
  eq: (column: unknown, value: unknown) => ({ __eq: [column, value] }),
}))

vi.mock("@chatbotx.io/database/schema", () => ({
  contactsOnSequenceModel: {
    id: "cos.id",
    workspaceId: "cos.workspaceId",
    status: "cos.status",
    nextStepId: "cos.nextStepId",
  },
}))

vi.mock("../src/dispatch-cancel", () => ({
  cancelPendingDispatches: (...args: unknown[]) =>
    mocks.cancelPendingDispatches(...args),
  removeDispatchesFromSchedule: (...args: unknown[]) =>
    mocks.removeDispatchesFromSchedule(...args),
}))

const { failEnrollmentStep, isEnrollmentStepRunnable } = await import(
  "../src/sequence-execution-state"
)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.enrollmentFindFirst.mockResolvedValue({
    status: "active",
    nextStepId: "step-1",
  })
  mocks.updateReturning.mockResolvedValue([{ id: "enrollment-1" }])
  mocks.cancelPendingDispatches.mockResolvedValue([
    { id: "dispatch-2", bucket: 8 },
  ])
  mocks.removeDispatchesFromSchedule.mockResolvedValue(undefined)
  mocks.transaction.mockImplementation(
    async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
      const tx = {
        update: () => ({
          set: (values: unknown) => {
            mocks.updateSet(values)
            return {
              where: () => ({
                returning: (...args: unknown[]) =>
                  mocks.updateReturning(...args),
              }),
            }
          },
        }),
      }
      return await callback(tx)
    },
  )
})

describe("isEnrollmentStepRunnable", () => {
  test("allows only an active enrollment whose nextStepId matches the dispatch step", async () => {
    await expect(
      isEnrollmentStepRunnable({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        stepId: "step-1",
      }),
    ).resolves.toBe(true)
  })

  test.each([
    [{ status: "failed", nextStepId: "step-1" }],
    [{ status: "active", nextStepId: "step-2" }],
    [undefined],
  ])("fails closed for non-runnable state %#", async (state) => {
    mocks.enrollmentFindFirst.mockResolvedValueOnce(state)

    await expect(
      isEnrollmentStepRunnable({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        stepId: "step-1",
      }),
    ).resolves.toBe(false)
  })
})

describe("failEnrollmentStep", () => {
  test("marks the owning active enrollment failed and cancels pending siblings", async () => {
    const result = await failEnrollmentStep({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "step-1",
      errorMessage: "provider timeout",
    })

    expect(mocks.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "failed",
        lastError: "provider timeout",
      }),
    )
    expect(mocks.cancelPendingDispatches).toHaveBeenCalledWith({
      client: expect.any(Object),
      enrollmentId: "enrollment-1",
      workspaceId: "ws-1",
      reason: "sequence_dispatch_failed",
      removeFromSchedule: false,
    })
    expect(mocks.removeDispatchesFromSchedule).toHaveBeenCalledWith([
      { id: "dispatch-2", bucket: 8 },
    ])
    expect(result).toEqual({ failed: true, canceledDispatches: 1 })
  })

  test("does not cancel siblings when a stale failure loses the generation claim", async () => {
    mocks.updateReturning.mockResolvedValueOnce([])

    const result = await failEnrollmentStep({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "stale-step",
      errorMessage: "late failure",
    })

    expect(mocks.cancelPendingDispatches).not.toHaveBeenCalled()
    expect(mocks.removeDispatchesFromSchedule).toHaveBeenCalledWith([])
    expect(result).toEqual({ failed: false, canceledDispatches: 0 })
  })

  test("commits the DB failure state before scheduler cleanup", async () => {
    const order: string[] = []
    mocks.transaction.mockImplementationOnce(
      async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => {
        const tx = {
          update: () => ({
            set: () => ({
              where: () => ({
                returning: async () => [{ id: "enrollment-1" }],
              }),
            }),
          }),
        }
        const result = await callback(tx)
        order.push("commit")
        return result
      },
    )
    mocks.cancelPendingDispatches.mockResolvedValueOnce([
      { id: "dispatch-2", bucket: 8 },
    ])
    mocks.removeDispatchesFromSchedule.mockImplementationOnce(() => {
      order.push("scheduler-cleanup")
    })

    await failEnrollmentStep({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "step-1",
      errorMessage: "failure",
    })

    expect(order).toEqual(["commit", "scheduler-cleanup"])
  })
})
