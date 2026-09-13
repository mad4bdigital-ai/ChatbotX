import { beforeEach, describe, expect, test, vi } from "vitest"

const stopOnReply = vi.hoisted(() => vi.fn())

vi.mock("@chatbotx.io/business", () => ({
  contactSequenceService: { stopOnReply },
}))

const { shouldStopSequenceOnReply, stopSequencesOnReplyIfNeeded } =
  await import("../src/integration/handlers/sequence-stop-on-reply")

beforeEach(() => {
  vi.clearAllMocks()
  stopOnReply.mockResolvedValue({
    stoppedEnrollments: 1,
    canceledDispatches: 1,
  })
})

describe("stopSequencesOnReplyIfNeeded", () => {
  test("stops only after a newly persisted inbound message", async () => {
    expect(
      shouldStopSequenceOnReply({
        isNewMessage: true,
        messageType: "incoming",
      }),
    ).toBe(true)

    await stopSequencesOnReplyIfNeeded({
      workspaceId: "ws-1",
      contactId: "contact-1",
      isNewMessage: true,
      messageType: "incoming",
    })

    expect(stopOnReply).toHaveBeenCalledOnce()
    expect(stopOnReply).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      contactId: "contact-1",
    })
  })

  test("does not stop on a duplicate or replayed inbound message", async () => {
    await stopSequencesOnReplyIfNeeded({
      workspaceId: "ws-1",
      contactId: "contact-1",
      isNewMessage: false,
      messageType: "incoming",
    })

    expect(stopOnReply).not.toHaveBeenCalled()
  })

  test("does not stop on an outgoing channel echo", async () => {
    await stopSequencesOnReplyIfNeeded({
      workspaceId: "ws-1",
      contactId: "contact-1",
      isNewMessage: true,
      messageType: "outgoing",
    })

    expect(stopOnReply).not.toHaveBeenCalled()
  })
})
