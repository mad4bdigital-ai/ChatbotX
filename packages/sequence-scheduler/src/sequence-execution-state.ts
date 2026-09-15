import { and, type DatabaseClient, db, eq } from "@chatbotx.io/database/client"
import { contactsOnSequenceModel } from "@chatbotx.io/database/schema"
import {
  cancelPendingDispatches,
  removeDispatchesFromSchedule,
} from "./dispatch-cancel"

export async function isEnrollmentStepRunnable(params: {
  workspaceId: string
  enrollmentId: string
  stepId: string
  client?: DatabaseClient
}): Promise<boolean> {
  const { workspaceId, enrollmentId, stepId, client = db } = params

  const enrollment = await client.query.contactsOnSequenceModel.findFirst({
    where: {
      id: enrollmentId,
      workspaceId,
    },
    columns: {
      status: true,
      nextStepId: true,
    },
  })

  return enrollment?.status === "active" && enrollment.nextStepId === stepId
}

export async function failEnrollmentStep(params: {
  workspaceId: string
  enrollmentId: string
  stepId: string
  errorMessage: string
}): Promise<{ failed: boolean; canceledDispatches: number }> {
  const { workspaceId, enrollmentId, stepId, errorMessage } = params

  const result = await db.transaction(async (tx) => {
    // `nextStepId` is the generation ownership token. A late failure from an
    // older dispatch must not fail a sequence that has already advanced.
    const claimed = await tx
      .update(contactsOnSequenceModel)
      .set({
        status: "failed",
        lastError: errorMessage,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contactsOnSequenceModel.id, enrollmentId),
          eq(contactsOnSequenceModel.workspaceId, workspaceId),
          eq(contactsOnSequenceModel.status, "active"),
          eq(contactsOnSequenceModel.nextStepId, stepId),
        ),
      )
      .returning({ id: contactsOnSequenceModel.id })

    if (claimed.length === 0) {
      return { failed: false, dispatchesToRemove: [] }
    }

    const dispatchesToRemove = await cancelPendingDispatches({
      client: tx,
      enrollmentId,
      workspaceId,
      reason: "sequence_dispatch_failed",
      removeFromSchedule: false,
    })

    return { failed: true, dispatchesToRemove }
  })

  // Redis/scheduler mutation happens only after the database transaction has
  // committed. If it fails, DB remains fail-closed (`status = failed`) and a
  // stale scheduled job is still blocked by `isEnrollmentStepRunnable`.
  await removeDispatchesFromSchedule(result.dispatchesToRemove)

  return {
    failed: result.failed,
    canceledDispatches: result.dispatchesToRemove.length,
  }
}
