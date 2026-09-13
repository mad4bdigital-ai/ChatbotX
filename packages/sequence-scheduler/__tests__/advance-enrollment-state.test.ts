import { beforeEach, describe, expect, test, vi } from "vitest"

const selectLimitMock = vi.fn()
const updateSetMock = vi.fn()
const updateWhereMock = vi.fn()
const updateReturningMock = vi.fn()

vi.mock("@chatbotx.io/database/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: (...args: unknown[]) => {
          updateWhereMock(...args)
          return { limit: (...limitArgs: unknown[]) => selectLimitMock(...limitArgs) }
        },
      }),
    }),
    update: () => ({
      set: (values: unknown) => {
        updateSetMock(values)
        return {
          where: (...args: unknown[]) => {
            updateWhereMock(...args)
            return {
              returning: (...returningArgs: unknown[]) =>
                updateReturningMock(...returningArgs),
            }
          },
        }
      },
    }),
  },
  and: (...args: unknown[]) => ({ __and: args }),
  eq: (column: unknown, value: unknown) => ({ __eq: [column, value] }),
  notInArray: (column: unknown, values: unknown[]) => ({
    __notInArray: [column, values],
  }),
}))

vi.mock("@chatbotx.io/database/schema", () => ({
  contactsOnSequenceModel: {
    id: "cos.id",
    workspaceId: "cos.workspaceId",
    status: "cos.status",
    nextStepId: "cos.nextStepId",
  },
  sequenceDispatchModel: {
    id: "dispatch.id",
    workspaceId: "dispatch.workspaceId",
    enrollmentId: "dispatch.enrollmentId",
    stepId: "dispatch.stepId",
    status: "dispatch.status",
  },
}))

const {
  claimEnrollmentCompleted,
  claimEnrollmentNextStep,
  hasBlockingSiblingDispatches,
} = await import("../src/advance-enrollment-state")

beforeEach(() => {
  vi.clearAllMocks()
  selectLimitMock.mockResolvedValue([])
  updateReturningMock.mockResolvedValue([{ id: "enrollment-1" }])
})

describe("hasBlockingSiblingDispatches", () => {
  test("returns false when every sibling is completed or canceled", async () => {
    selectLimitMock.mockResolvedValueOnce([])

    await expect(
      hasBlockingSiblingDispatches({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        stepId: "step-1",
      }),
    ).resolves.toBe(false)
  })

  test("returns true when a pending, running, or failed sibling exists", async () => {
    selectLimitMock.mockResolvedValueOnce([{ id: "dispatch-blocker" }])

    await expect(
      hasBlockingSiblingDispatches({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        stepId: "step-1",
      }),
    ).resolves.toBe(true)
  })
})

describe("atomic enrollment advancement claims", () => {
  test("claims the next generation and writes the new state", async () => {
    const nextRunAt = new Date("2026-09-14T10:00:00Z")

    await expect(
      claimEnrollmentNextStep({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        currentStepId: "step-1",
        nextStepId: "step-2",
        nextStepOrder: 1,
        nextRunAt,
      }),
    ).resolves.toBe(true)

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStep: 1,
        lastStepId: "step-1",
        nextStepId: "step-2",
        nextRunAt,
      }),
    )
    expect(updateWhereMock).toHaveBeenCalledWith({
      __and: expect.arrayContaining([
        { __eq: ["cos.id", "enrollment-1"] },
        { __eq: ["cos.workspaceId", "ws-1"] },
        { __eq: ["cos.status", "active"] },
        { __eq: ["cos.nextStepId", "step-1"] },
      ]),
    })
  })

  test("returns false when another sibling already claimed the generation", async () => {
    updateReturningMock.mockResolvedValueOnce([])

    await expect(
      claimEnrollmentNextStep({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        currentStepId: "step-1",
        nextStepId: "step-2",
        nextStepOrder: 1,
        nextRunAt: new Date("2026-09-14T10:00:00Z"),
      }),
    ).resolves.toBe(false)
  })

  test("completion uses the same state-machine ownership claim", async () => {
    const sentAt = new Date("2026-09-14T09:00:00Z")

    await expect(
      claimEnrollmentCompleted({
        workspaceId: "ws-1",
        enrollmentId: "enrollment-1",
        currentStepId: "step-9",
        currentStepOrder: 8,
        sentAt,
      }),
    ).resolves.toBe(true)

    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "completed",
        completedAt: sentAt,
        currentStep: 9,
        lastStepId: "step-9",
        nextStepId: null,
        nextRunAt: null,
      }),
    )
    expect(updateWhereMock).toHaveBeenCalledWith({
      __and: expect.arrayContaining([
        { __eq: ["cos.status", "active"] },
        { __eq: ["cos.nextStepId", "step-9"] },
      ]),
    })
  })
})
