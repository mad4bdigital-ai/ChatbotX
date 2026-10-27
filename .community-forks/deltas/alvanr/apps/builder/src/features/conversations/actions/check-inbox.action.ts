"use server"

import { ScheduleJobData, scheduleQueue } from "@chatbotx.io/worker-config"
import { z } from "zod"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schema"
import { workspaceActionClient } from "@/lib/safe-action"

export const checkInboxAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .schema(z.object({}))
  .action(
    async ({
      bindArgsParsedInputs: [workspaceId],
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
    }) => {
      await scheduleQueue.add(ScheduleJobData.pollInstagramComments, {
        type: ScheduleJobData.pollInstagramComments,
        data: {},
      })

      return {
        success: true,
        checkedAt: new Date().toISOString(),
        workspaceId,
      }
    },
  )
