import {
  and,
  type DatabaseClient,
  db,
  eq,
  notInArray,
} from "@chatbotx.io/database/client"
import {
  contactsOnSequenceModel,
  sequenceDispatchModel,
} from "@chatbotx.io/database/schema"

const ADVANCEABLE_DISPATCH_STATUSES = ["completed", "canceled"]

export async function hasBlockingSiblingDispatches(params: {
  workspaceId: string
  enrollmentId: string
  stepId: string
  client?: DatabaseClient
}): Promise<boolean> {
  const { workspaceId, enrollmentId, stepId, client = db } = params

  const [blocking] = await client
    .select({ id: sequenceDispatchModel.id })
    .from(sequenceDispatchModel)
    .where(
      and(
        eq(sequenceDispatchModel.workspaceId, workspaceId),
        eq(sequenceDispatchModel.enrollmentId, enrollmentId),
        eq(sequenceDispatchModel.stepId, stepId),
        notInArray(
          sequenceDispatchModel.status,
          ADVANCEABLE_DISPATCH_STATUSES,
        ),
      ),
    )
    .limit(1)

  return Boolean(blocking)
}

function buildAdvanceClaimWhere(params: {
  workspaceId: string
  enrollmentId: string
  currentStepId: string
}) {
  const { workspaceId, enrollmentId, currentStepId } = params

  return and(
    eq(contactsOnSequenceModel.id, enrollmentId),
    eq(contactsOnSequenceModel.workspaceId, workspaceId),
    eq(contactsOnSequenceModel.status, "active"),
    eq(contactsOnSequenceModel.nextStepId, currentStepId),
  )
}

export async function claimEnrollmentCompleted(params: {
  workspaceId: string
  enrollmentId: string
  currentStepId: string
  currentStepOrder: number
  sentAt: Date
  client?: DatabaseClient
}): Promise<boolean> {
  const {
    workspaceId,
    enrollmentId,
    currentStepId,
    currentStepOrder,
    sentAt,
    client = db,
  } = params

  const claimed = await client
    .update(contactsOnSequenceModel)
    .set({
      status: "completed",
      completedAt: sentAt,
      currentStep: currentStepOrder + 1,
      lastStepId: currentStepId,
      nextStepId: null,
      nextRunAt: null,
      updatedAt: new Date(),
    })
    .where(
      buildAdvanceClaimWhere({ workspaceId, enrollmentId, currentStepId }),
    )
    .returning({ id: contactsOnSequenceModel.id })

  return claimed.length > 0
}

export async function claimEnrollmentNextStep(params: {
  workspaceId: string
  enrollmentId: string
  currentStepId: string
  nextStepId: string
  nextStepOrder: number
  nextRunAt: Date
  client?: DatabaseClient
}): Promise<boolean> {
  const {
    workspaceId,
    enrollmentId,
    currentStepId,
    nextStepId,
    nextStepOrder,
    nextRunAt,
    client = db,
  } = params

  const claimed = await client
    .update(contactsOnSequenceModel)
    .set({
      currentStep: nextStepOrder,
      lastStepId: currentStepId,
      nextStepId,
      nextRunAt,
      updatedAt: new Date(),
    })
    .where(
      buildAdvanceClaimWhere({ workspaceId, enrollmentId, currentStepId }),
    )
    .returning({ id: contactsOnSequenceModel.id })

  return claimed.length > 0
}
