import type { Job } from "bullmq"
import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findRunningDispatch: vi.fn(),
  markDispatchCompleted: vi.fn(),
  markDispatchCanceled: vi.fn(),
  markDispatchFailed: vi.fn(),
  fetchStep: vi.fn(),
  validateStep: vi.fn(),
  sendFlowDirect: vi.fn(),
  advanceEnrollment: vi.fn(),
  isEnrollmentStepRunnable: vi.fn(),
  failEnrollmentStep: vi.fn(),
  removeFromSchedule: vi.fn(),
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

vi.mock("@chatbotx.io/redis", () => ({
  sequenceConnections: { useExisting: vi.fn().mockResolvedValue({}) },
}))

vi.mock("@chatbotx.io/scheduler", () => ({
  SchedulerClient: class {
    removeFromSchedule = mocks.removeFromSchedule
  },
}))

vi.mock("@chatbotx.io/sequence-scheduler", () => ({
  advanceEnrollment: (...args: unknown[]) => mocks.advanceEnrollment(...args),
  isEnrollmentStepRunnable: (...args: unknown[]) =>
    mocks.isEnrollmentStepRunnable(...args),
  failEnrollmentStep: (...args: unknown[]) => mocks.failEnrollmentStep(...args),
}))

vi.mock("../src/sequence-scheduler/services/step-executor.service", () => ({
  StepExecutorService: class {
    fetchStep = mocks.fetchStep
    validateStep = mocks.validateStep
  },
}))

vi.mock("../src/integration/handlers/send-flow-direct", () => ({
  sendFlowDirect: (...args: unknown[]) => mocks.sendFlowDirect(...args),
}))

vi.mock("../src/lib/logger", () => ({
  logger: { error: vi.fn() },
}))

const { handleSendSequenceFlow } = await import(
  "../src/integration/handlers/sequence-flow"
)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findRunningDispatch.mockResolvedValue({
    id: "dispatch-1",
    workspaceId: "ws-1",
    completedAt: null,
  })
  const step = {
    id: "step-1",
    order: 0,
    isActive: true,
    flow: { id: "flow-1" },
  }
  mocks.fetchStep.mockResolvedValue(step)
  mocks.validateStep.mockReturnValue({ valid: true, step })
  mocks.sendFlowDirect.mockResolvedValue(new Date())
  mocks.markDispatchCompleted.mockResolvedValue(undefined)
  mocks.advanceEnrollment.mockResolvedValue(undefined)
  mocks.isEnrollmentStepRunnable.mockResolvedValue(true)
  mocks.failEnrollmentStep.mockResolvedValue({
    failed: true,
    canceledDispatches: 0,
  })
  mocks.removeFromSchedule.mockResolvedValue(undefined)
})

describe("sequence dispatch channel routing", () => {
  test("threads the dispatch ContactInbox into sendFlowDirect", async () => {
    const data = {
      dispatchId: "dispatch-1",
      workspaceId: "ws-1",
      stepId: "step-1",
      bucket: 42,
      contactId: "contact-1",
      contactInboxId: "ci-2",
      sequenceId: "seq-1",
      enrollmentId: "enroll-1",
      metadata: {},
    } as Parameters<typeof handleSendSequenceFlow>[0]

    const job = {
      id: "seq-job-1",
      attemptsMade: 0,
      opts: { attempts: 3 },
    } as unknown as Job

    await handleSendSequenceFlow(data, job)

    expect(mocks.sendFlowDirect).toHaveBeenCalledOnce()
    expect(mocks.sendFlowDirect).toHaveBeenCalledWith({
      flowId: "flow-1",
      workspaceId: "ws-1",
      contactId: "contact-1",
      contactInboxId: "ci-2",
      metadata: {},
      flowExecutionKey: "seq-job-1",
    })
  })
})
