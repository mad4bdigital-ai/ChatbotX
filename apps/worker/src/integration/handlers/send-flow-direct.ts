import { contactInboxService, conversationService } from "@chatbotx.io/business"
import type { MetadataPayload } from "@chatbotx.io/flow-config"
import { runFlowNode } from "./flow"

export interface SendFlowDirectParams {
  contactId: string
  contactInboxId?: string
  flowExecutionKey?: string
  flowId: string
  metadata?: MetadataPayload
  workspaceId: string
}

export async function sendFlowDirect(
  params: SendFlowDirectParams,
): Promise<Date> {
  const {
    flowExecutionKey,
    flowId,
    workspaceId,
    contactId,
    contactInboxId,
    metadata,
  } = params

  const conversation = await conversationService.findBy({
    where: { contactId, workspaceId },
  })

  if (!conversation) {
    throw new Error(`Conversation not found for contact ${contactId}`)
  }

  if (contactInboxId) {
    const contactInbox = await contactInboxService.findByUncached({
      where: { id: contactInboxId, contactId },
    })

    if (!contactInbox) {
      throw new Error(
        `Contact inbox ${contactInboxId} not found for contact ${contactId}`,
      )
    }

    await runFlowNode(
      {
        flowId,
        metadata,
        conversationId: conversation,
        contactInboxId: contactInbox,
      },
      { flowExecutionKey },
    )

    return new Date()
  }

  // Backward-compatible fallback for non-sequence callers that intentionally
  // target the contact rather than one channel identity. Sequence dispatches
  // MUST pass contactInboxId so one dispatch cannot fan out to every inbox.
  const allContactInboxes = await contactInboxService.listByContactId({
    workspaceId,
    contactId,
  })

  await Promise.all(
    allContactInboxes.map(async (contactInbox) => {
      await runFlowNode(
        {
          flowId,
          metadata,
          conversationId: conversation,
          contactInboxId: contactInbox,
        },
        { flowExecutionKey },
      )
    }),
  )

  return new Date()
}
