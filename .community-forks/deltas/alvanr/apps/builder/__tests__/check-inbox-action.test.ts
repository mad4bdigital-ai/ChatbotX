// @vitest-environment node

import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  scheduleQueueAdd: vi.fn().mockResolvedValue({ id: "job-1" }),
}))

vi.mock("@chatbotx.io/worker-config", () => ({
  ScheduleJobData: {
    pollInstagramComments: "pollInstagramComments",
  },
  scheduleQueue: {
    add: mocks.scheduleQueueAdd,
  },
}))

vi.mock("@/lib/safe-action", () => ({
  workspaceActionClient: {
    bindArgsSchemas: vi.fn(() => ({
      action: vi.fn(
        (
          handler: (args: {
            bindArgsParsedInputs: [string]
          }) => Promise<unknown>,
        ) =>
          (workspaceId: string) =>
            handler({ bindArgsParsedInputs: [workspaceId] }),
      ),
    })),
  },
}))

const { checkInboxAction } = await import(
  "../src/features/conversations/actions/check-inbox.action"
)

describe("checkInboxAction", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("enqueues pollInstagramComments job into scheduleQueue", async () => {
    const result = await (
      checkInboxAction as unknown as (id: string) => Promise<{
        success: boolean
        workspaceId: string
      }>
    )("ws-test-123")

    expect(result.success).toBe(true)
    expect(result.workspaceId).toBe("ws-test-123")
    expect(mocks.scheduleQueueAdd).toHaveBeenCalledTimes(1)
    expect(mocks.scheduleQueueAdd).toHaveBeenCalledWith(
      "pollInstagramComments",
      {
        type: "pollInstagramComments",
        data: {},
      },
    )
  })
})
