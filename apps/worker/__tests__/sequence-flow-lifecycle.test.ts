import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findRunningDispatch: vi.fn(),
  markDispatchCompleted: vi.fn(),
  markDispatchCanceled: vi.fn(),
  markDispatchFailed: vi.fn(),
  isEnrollmentStepRunnable: vi.fn(),
  failEnrollmentStep: vi.fn(),
  advanceEnrollment: vi.fn(),
  sendFlowDirect: vi.fn(),
  fetchStep: vi.fn(),
  validateStep: vi.fn(),
  removeFromSchedule: vi.fn(),
  isFinalAttempt: vi.fn(),
}))

vi.mock("@chatbotx.io/business/contact-sequence", () => ({
  contactSequenceService: {
    findRunningDispatch: (...args: unknown[]) =>
      mocks.findRunningDispatch(...args),
    markDispatchCompleted: (...args: unknown[]) =>
      mocks.markDispatchCompleted(...args),
    markDispatchCanceled: (...args: unknown[]) =>
      mocks.markDispatchCanceled(...args),
    markDispatchFailed: (...args: unknown[]) =>
      mocks.markDispatchFailed(...args),
  },
}))

vi.mock("@chatbotx.io/sequence-scheduler", () => ({
  advanceEnrollment: (...args: unknown[]) => mocks.advanceEnrollment(...args),
  isEnrollmentStepRunnable: (...args: unknown[]) =>
    mocks.isEnrollmentStepRunnable(...args),
  failEnrollmentStep: (...args: unknown[]) => mocks.failEnrollmentStep(...args),
}))

vi.mock("@chatbotx.io/redis", () => ({
  sequenceConnections: {
    useExisting: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock("@chatbotx.io/scheduler", () => ({
  SchedulerClient: vi.fn(function SchedulerClientMock() {
    return { removeFromSchedule: mocks.removeFromSchedule }
  }),
}))

vi.mock("../src/sequence-scheduler/services/step-executor.service", () => ({
  StepExecutorService: vi.fn(function StepExecutorServiceMock() {
    return {
      fetchStep: mocks.fetchStep,
      validateStep: mocks.validateStep,
    }
  }),
}))

vi.mock("../src/integration/handlers/send-flow-direct", () => ({
  sendFlowDirect: (...args: unknown[]) => mocks.sendFlowDirect(...args),
}))

vi.mock("../src/lib/job-attempts", () => ({
  isFinalAttempt: (...args: unknown[]) => mocks.isFinalAttempt(...args),
}))

vi.mock("../src/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const { handleSendSequenceFlow } = await import(
  "../src/integration/handlers/sequence-flow"
)

const DATA = {
  dispatchId: "dispatch-1",
  workspaceId: "ws-1",
  stepId: "step-1",
  bucket: 7,
  contactId: "contact-1",
  contactInboxId: "contact-inbox-1",
  sequenceId: "sequence-1",
  enrollmentId: "enrollment-1",
  metadata: {},
} as never

function makeJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    attemptsMade: 0,
    opts: { attempts: 3 },
    ...overrides,
  } as never
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findRunningDispatch.mockResolvedValue({
    id: "dispatch-1",
    completedAt: null,
  })
  mocks.isEnrollmentStepRunnable.mockResolvedValue(true)
  mocks.fetchStep.mockResolvedValue({
    id: "step-1",
    order: 0,
    flow: { id: "flow-1" },
  })
  mocks.validateStep.mockImplementation((step) => ({ valid: true, step }))
  mocks.sendFlowDirect.mockResolvedValue(new Date())
  mocks.markDispatchCompleted.mockResolvedValue(undefined)
  mocks.markDispatchCanceled.mockResolvedValue(undefined)
  mocks.markDispatchFailed.mockResolvedValue(undefined)
  mocks.advanceEnrollment.mockResolvedValue(undefined)
  mocks.failEnrollmentStep.mockResolvedValue({
    failed: true,
    canceledDispatches: 1,
  })
  mocks.removeFromSchedule.mockResolvedValue(undefined)
  mocks.isFinalAttempt.mockReturnValue(false)
})

describe("sendSequenceFlow execution lifecycle", () => {
  test("cancels a claimed dispatch without sending when its enrollment is no longer runnable", async () => {
    mocks.isEnrollmentStepRunnable.mockResolvedValueOnce(false)

    await handleSendSequenceFlow(DATA, makeJob())

    expect(mocks.isEnrollmentStepRunnable).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "step-1",
    })
    expect(mocks.markDispatchCanceled).toHaveBeenCalledWith({
      dispatchId: "dispatch-1",
      workspaceId: "ws-1",
      reason: "enrollment_not_runnable",
    })
    expect(mocks.sendFlowDirect).not.toHaveBeenCalled()
    expect(mocks.fetchStep).not.toHaveBeenCalled()
    expect(mocks.removeFromSchedule).toHaveBeenCalledWith(7, "dispatch-1")
  })

  test("sends only after the execution-time enrollment gate succeeds", async () => {
    await handleSendSequenceFlow(DATA, makeJob())

    expect(mocks.isEnrollmentStepRunnable).toHaveBeenCalledTimes(1)
    expect(mocks.sendFlowDirect).toHaveBeenCalledWith(
      expect.objectContaining({
        flowId: "flow-1",
        workspaceId: "ws-1",
        contactId: "contact-1",
        contactInboxId: "contact-inbox-1",
      }),
    )
    expect(mocks.markDispatchCompleted).toHaveBeenCalledTimes(1)
    expect(mocks.advanceEnrollment).toHaveBeenCalledTimes(1)
  })

  test("on a final send failure, fails the current dispatch and owning enrollment generation", async () => {
    const error = new Error("provider timeout")
    mocks.sendFlowDirect.mockRejectedValueOnce(error)
    mocks.isFinalAttempt.mockReturnValueOnce(true)

    await expect(handleSendSequenceFlow(DATA, makeJob())).rejects.toThrow(
      "provider timeout",
    )

    expect(mocks.markDispatchFailed).toHaveBeenCalledWith({
      dispatchId: "dispatch-1",
      workspaceId: "ws-1",
      errorMessage: "provider timeout",
    })
    expect(mocks.failEnrollmentStep).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      enrollmentId: "enrollment-1",
      stepId: "step-1",
      errorMessage: "provider timeout",
    })
    expect(mocks.removeFromSchedule).toHaveBeenCalledWith(7, "dispatch-1")
  })

  test("does not fail the enrollment before the final retry", async () => {
    mocks.sendFlowDirect.mockRejectedValueOnce(new Error("transient"))
    mocks.isFinalAttempt.mockReturnValueOnce(false)

    await expect(handleSendSequenceFlow(DATA, makeJob())).rejects.toThrow(
      "transient",
    )

    expect(mocks.markDispatchFailed).not.toHaveBeenCalled()
    expect(mocks.failEnrollmentStep).not.toHaveBeenCalled()
    expect(mocks.removeFromSchedule).not.toHaveBeenCalled()
  })
})
