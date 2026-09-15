import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  contactsOnSequenceFindFirst: vi.fn(),
  sequenceStepFindFirst: vi.fn(),
  sequenceFindFirst: vi.fn(),
  calculateNextRunAtFromStep: vi.fn(),
  enrollContactInSequence: vi.fn(),
  emitSequenceSubscribed: vi.fn(),
}))

vi.mock("@chatbotx.io/database/client", () => ({
  db: {
    query: {
      contactsOnSequenceModel: {
        findFirst: (...args: unknown[]) =>
          mocks.contactsOnSequenceFindFirst(...args),
      },
      sequenceStepModel: {
        findFirst: (...args: unknown[]) => mocks.sequenceStepFindFirst(...args),
      },
      sequenceModel: {
        findFirst: (...args: unknown[]) => mocks.sequenceFindFirst(...args),
      },
    },
  },
  and: (...args: unknown[]) => ({ and: args }),
  eq: (col: unknown, value: unknown) => ({ eq: [col, value] }),
  inArray: (col: unknown, values: unknown) => ({ inArray: [col, values] }),
}))

vi.mock("@chatbotx.io/database/schema", () => ({
  contactsOnSequenceModel: { id: "contactsOnSequenceModel.id" },
  sequenceModel: { id: "sequenceModel.id", name: "sequenceModel.name" },
}))

vi.mock("@chatbotx.io/events", () => ({
  emitSequenceSubscribed: (...args: unknown[]) =>
    mocks.emitSequenceSubscribed(...args),
  emitSequenceUnsubscribed: vi.fn(),
}))

vi.mock("@chatbotx.io/sequence-scheduler", () => ({
  calculateNextRunAtFromStep: (...args: unknown[]) =>
    mocks.calculateNextRunAtFromStep(...args),
  cancelPendingDispatches: vi.fn(),
  enrollContactInSequence: (...args: unknown[]) =>
    mocks.enrollContactInSequence(...args),
  enrollContactsInSequenceBulk: vi.fn(),
  removeDispatchesFromSchedule: vi.fn(),
  sequenceDispatchUtils: {
    findRunning: vi.fn(),
    markCompleted: vi.fn(),
    markCanceled: vi.fn(),
    markFailed: vi.fn(),
  },
}))

vi.mock("../src/contact/service", () => ({
  contactService: { findManyByIds: vi.fn() },
}))

vi.mock("../src/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), debug: vi.fn(), info: vi.fn() },
}))

const { contactSequenceService } = await import(
  "../src/contact-sequence/service"
)

beforeEach(() => {
  vi.clearAllMocks()
  mocks.contactsOnSequenceFindFirst.mockResolvedValue(null)
  mocks.sequenceFindFirst.mockResolvedValue({ name: "Specific time" })
  mocks.enrollContactInSequence.mockResolvedValue(undefined)
  mocks.emitSequenceSubscribed.mockResolvedValue(undefined)
})

describe("contactSequenceService.enrollFromFlow scheduling", () => {
  test("uses the canonical delay helper so specificDateTime is honored", async () => {
    const specificDateTime = new Date("2026-10-01T09:30:00.000Z")
    mocks.sequenceStepFindFirst.mockResolvedValue({
      id: "step-1",
      delayDays: 0,
      delayMinutes: 0,
      delayUnit: "specificTime",
      specificDateTime,
    })
    mocks.calculateNextRunAtFromStep.mockReturnValue(specificDateTime)

    await contactSequenceService.enrollFromFlow({
      workspaceId: "ws-1",
      contactId: "contact-1",
      sequenceId: "seq-1",
      contactInboxId: "ci-1",
    })

    expect(mocks.calculateNextRunAtFromStep).toHaveBeenCalledOnce()
    expect(mocks.calculateNextRunAtFromStep).toHaveBeenCalledWith(
      {
        id: "step-1",
        delayDays: 0,
        delayMinutes: 0,
        delayUnit: "specificTime",
        specificDateTime,
      },
      expect.any(Date),
    )
    expect(mocks.enrollContactInSequence).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "ws-1",
        contactId: "contact-1",
        sequenceId: "seq-1",
        nextStepId: "step-1",
        nextRunAt: specificDateTime,
      }),
    )
  })
})
