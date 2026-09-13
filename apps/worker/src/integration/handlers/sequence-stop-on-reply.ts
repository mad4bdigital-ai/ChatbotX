import { contactSequenceService } from "@chatbotx.io/business"

export const shouldStopSequenceOnReply = (params: {
  isNewMessage: boolean
  messageType: string | null | undefined
}): boolean => params.isNewMessage && params.messageType !== "outgoing"

export async function stopSequencesOnReplyIfNeeded(params: {
  workspaceId: string
  contactId: string
  isNewMessage: boolean
  messageType: string | null | undefined
}): Promise<void> {
  if (!shouldStopSequenceOnReply(params)) {
    return
  }

  await contactSequenceService.stopOnReply({
    workspaceId: params.workspaceId,
    contactId: params.contactId,
  })
}
