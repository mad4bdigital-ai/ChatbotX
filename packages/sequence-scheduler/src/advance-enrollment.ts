import { and, asc, db, eq, gt } from "@chatbotx.io/database/client"
import { sequenceStepModel } from "@chatbotx.io/database/schema"
import type { SchedulerClient } from "@chatbotx.io/scheduler"
import {
  claimEnrollmentCompleted,
  claimEnrollmentNextStep,
  hasBlockingSiblingDispatches,
} from "./advance-enrollment-state"
import { calculateNextRunAtFromStep } from "./calculate-next-run-at"
import { getContactInboxes } from "./contacts-on-sequences"
import { createDispatch } from "./dispatch-manager"
import { calculateNextValidSendTime } from "./send-time-validator"

type NextStepForSchedule = {
  id: string
  order: number
  delayDays: number
  delayMinutes: number
  delayUnit: string | null
  specificDateTime: Date | null
  anytime: boolean
  sendTimeStart: string | null
  sendTimeEnd: string | null
  sendDays: string | null
}

type DispatchToSchedule = { id: string; bucket: number; runAtMs: string }

function calculateNextRunAt(step: NextStepForSchedule, baseTime: Date): Date {
  const calculatedTime = calculateNextRunAtFromStep(
    {
      delayDays: step.delayDays,
      delayMinutes: step.delayMinutes,
      delayUnit: step.delayUnit,
      specificDateTime: step.specificDateTime,
    },
    baseTime,
  )

  return calculateNextValidSendTime(calculatedTime, {
    anytime: step.anytime,
    sendTimeStart: step.sendTimeStart,
    sendTimeEnd: step.sendTimeEnd,
    sendDays: step.sendDays,
  })
}

export interface AdvanceEnrollmentParams {
  contactId: string
  currentStep: { id: string; order: number }
  enrollmentId: string
  scheduler: SchedulerClient
  sentAt: Date
  sequenceId: string
  workspaceId: string
}

export async function advanceEnrollment(
  params: AdvanceEnrollmentParams,
): Promise<void> {
  const {
    enrollmentId,
    workspaceId,
    sequenceId,
    contactId,
    currentStep,
    sentAt,
    scheduler,
  } = params

  const enrollment = await db.query.contactsOnSequenceModel.findFirst({
    where: { id: enrollmentId, workspaceId },
  })

  if (!enrollment) {
    throw new Error(`Enrollment ${enrollmentId} not found`)
  }

  if (enrollment.status !== "active") {
    return
  }

  if (enrollment.lastStepId === currentStep.id) {
    return
  }

  // `nextStepId` is the state-machine ownership token for the current
  // generation. A stale or out-of-order dispatch must never advance a newer
  // enrollment generation even when `lastStepId` has not caught up.
  if (enrollment.nextStepId !== currentStep.id) {
    return
  }

  // A sequence step is dispatched once per ContactInbox. Advancing after the
  // first sibling finishes can schedule the next step on another inbox before
  // that inbox finished the current step. Wait until all siblings are either
  // completed or intentionally canceled. Failed/pending/running siblings block
  // advancement and keep the sequence fail-closed.
  if (
    await hasBlockingSiblingDispatches({
      workspaceId,
      enrollmentId,
      stepId: currentStep.id,
    })
  ) {
    return
  }

  const [nextStep] = await db
    .select()
    .from(sequenceStepModel)
    .where(
      and(
        eq(sequenceStepModel.sequenceId, sequenceId),
        gt(sequenceStepModel.order, currentStep.order),
        eq(sequenceStepModel.isActive, true),
      ),
    )
    .orderBy(asc(sequenceStepModel.order))
    .limit(1)

  if (!nextStep) {
    await claimEnrollmentCompleted({
      workspaceId,
      enrollmentId,
      currentStepId: currentStep.id,
      currentStepOrder: currentStep.order,
      sentAt,
    })
    return
  }

  const dispatches = await db.transaction(async (tx) => {
    const nextRunAt = calculateNextRunAt(nextStep, sentAt)

    const claimed = await claimEnrollmentNextStep({
      client: tx,
      workspaceId,
      enrollmentId,
      currentStepId: currentStep.id,
      nextStepId: nextStep.id,
      nextStepOrder: nextStep.order,
      nextRunAt,
    })

    // Multiple sibling dispatches can observe the generation barrier as open
    // at the same time. The conditional UPDATE inside claimEnrollmentNextStep
    // is the atomic winner election; losers must not create duplicate next-step
    // dispatches.
    if (!claimed) {
      return []
    }

    const contactInboxes = await getContactInboxes(workspaceId, contactId)
    const nextDispatches: DispatchToSchedule[] = []

    for (const contactInbox of contactInboxes) {
      const nextDispatch = await createDispatch({
        workspaceId,
        sequenceId,
        contactId,
        stepId: nextStep.id,
        enrollmentId,
        runAt: nextRunAt,
        client: tx,
        contactInboxId: contactInbox.id,
      })

      nextDispatches.push(nextDispatch)
    }

    return nextDispatches
  })

  for (const dispatch of dispatches) {
    await scheduler.addToSchedule(
      dispatch.bucket,
      dispatch.id,
      Number(dispatch.runAtMs),
    )
  }
}
