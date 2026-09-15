import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  findConversation: vi.fn(),
  findContactInbox: vi.fn(),
  listContactInboxes: vi.fn(),
  runFlowNode: vi.fn(),
}))

vi.mock("@chatbotx.io/business", () => ({
  conversationService: {
    findBy: (...args: unknown[]) => mocks.findConversation(...args),
  },
  contactInboxService: {
    findByUncached: (...args: unknown[]) => mocks.findContactInbox(...args),
    listByContactId: (...args: unknown[]) => mocks.listContactInboxes(...args),
  },
}))

vi.mock("../src/integration/handlers/flow", () => ({
  runFlowNode: (...args: unknown[]) => mocks.runFlowNode(...args),
}))

const { sendFlowDirect } = await import(
  "../src/integration/handlers/send-flow-direct"
)

const conversation = {
  id: "conversation-1",
  workspaceId: "ws-1",
  contactId: "contact-1",
}

const contactInbox = (id: string) => ({
  id,
  contactId: "contact-1",
  inboxId: `inbox-${id}`,
  channel: "whatsapp",
  source: "inboundMessage",
  sourceId: `source-${id}`,
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findConversation.mockResolvedValue(conversation)
  mocks.runFlowNode.mockResolvedValue(undefined)
})

describe("sendFlowDirect", () => {
  test("targets only the explicit ContactInbox when contactInboxId is supplied", async () => {
    const intendedInbox = contactInbox("ci-2")
    mocks.findContactInbox.mockResolvedValue(intendedInbox)
    mocks.listContactInboxes.mockResolvedValue([
      contactInbox("ci-1"),
      intendedInbox,
      contactInbox("ci-3"),
    ])

    await sendFlowDirect({
      workspaceId: "ws-1",
      contactId: "contact-1",
      contactInboxId: "ci-2",
      flowId: "flow-1",
      flowExecutionKey: "seq-job-1",
      metadata: { type: "sequence" } as never,
    })

    expect(mocks.findContactInbox).toHaveBeenCalledWith({
      where: { id: "ci-2", contactId: "contact-1" },
    })
    expect(mocks.listContactInboxes).not.toHaveBeenCalled()
    expect(mocks.runFlowNode).toHaveBeenCalledTimes(1)
    expect(mocks.runFlowNode).toHaveBeenCalledWith(
      expect.objectContaining({
        flowId: "flow-1",
        conversationId: conversation,
        contactInboxId: intendedInbox,
      }),
      { flowExecutionKey: "seq-job-1" },
    )
  })

  test("fails closed when the explicit ContactInbox no longer exists for the contact", async () => {
    mocks.findContactInbox.mockResolvedValue(undefined)

    await expect(
      sendFlowDirect({
        workspaceId: "ws-1",
        contactId: "contact-1",
        contactInboxId: "ci-missing",
        flowId: "flow-1",
      }),
    ).rejects.toThrow(
      "Contact inbox ci-missing not found for contact contact-1",
    )

    expect(mocks.runFlowNode).not.toHaveBeenCalled()
    expect(mocks.listContactInboxes).not.toHaveBeenCalled()
  })

  test("keeps contact-wide fan-out only for callers that omit contactInboxId", async () => {
    const inboxes = [contactInbox("ci-1"), contactInbox("ci-2")]
    mocks.listContactInboxes.mockResolvedValue(inboxes)

    await sendFlowDirect({
      workspaceId: "ws-1",
      contactId: "contact-1",
      flowId: "flow-1",
      flowExecutionKey: "legacy-job",
    })

    expect(mocks.findContactInbox).not.toHaveBeenCalled()
    expect(mocks.listContactInboxes).toHaveBeenCalledWith({
      workspaceId: "ws-1",
      contactId: "contact-1",
    })
    expect(mocks.runFlowNode).toHaveBeenCalledTimes(2)
    expect(mocks.runFlowNode).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ contactInboxId: inboxes[0] }),
      { flowExecutionKey: "legacy-job" },
    )
    expect(mocks.runFlowNode).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ contactInboxId: inboxes[1] }),
      { flowExecutionKey: "legacy-job" },
    )
  })
})
