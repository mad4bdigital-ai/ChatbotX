// @vitest-environment node
import { beforeEach, describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => ({ list: vi.fn() }))

vi.mock("@/lib/orpc/orpc", () => ({
  client: { fbCommentsAPI: { facebookPostsAPI: mocks.list } },
}))

import { createFbCommentPostsStore } from "../src/features/fb-comments/provider/fb-comment-posts-store"

const initialPosts = {
  published: [{ id: "post-1" }],
  ads: [],
  reels: [],
  pages: [{ id: "page-1", name: "Page" }],
}

describe("Facebook post picker source refresh", () => {
  beforeEach(() => {
    mocks.list.mockReset()
  })

  test("initializes once and refreshes when explicitly requested", async () => {
    mocks.list.mockResolvedValueOnce(initialPosts).mockResolvedValueOnce({
      ...initialPosts,
      published: [{ id: "post-2" }],
    })
    const store = createFbCommentPostsStore({ workspaceId: "workspace-1" })
    await store.getState().initialize()
    await store.getState().initialize()
    expect(mocks.list).toHaveBeenCalledTimes(1)
    expect(store.getState().publishedPosts[0]?.id).toBe("post-1")

    await store.getState().fetchPosts()
    expect(mocks.list).toHaveBeenCalledTimes(2)
    expect(mocks.list).toHaveBeenLastCalledWith({ workspaceId: "workspace-1" })
    expect(store.getState().publishedPosts[0]?.id).toBe("post-2")
  })

  test("does not issue overlapping requests on dialog opening", async () => {
    let resolveRequest!: (value: typeof initialPosts) => void
    mocks.list.mockImplementationOnce(
      () =>
        new Promise<typeof initialPosts>((resolve) => {
          resolveRequest = resolve
        }),
    )
    const store = createFbCommentPostsStore({ workspaceId: "workspace-2" })
    const first = store.getState().initialize()
    await store.getState().fetchPosts()
    expect(mocks.list).toHaveBeenCalledTimes(1)
    resolveRequest(initialPosts)
    await first
    expect(store.getState().initialized).toBe(true)
  })

  test("preserves previous choices on fetch failure and allows retry", async () => {
    mocks.list
      .mockResolvedValueOnce(initialPosts)
      .mockRejectedValueOnce(new Error("Provider temporarily unavailable"))
      .mockResolvedValueOnce({
        ...initialPosts,
        published: [{ id: "post-recovered" }],
      })
    const store = createFbCommentPostsStore({ workspaceId: "workspace-3" })
    await store.getState().initialize()
    await store.getState().fetchPosts()
    expect(store.getState().error).toBe("Provider temporarily unavailable")
    expect(store.getState().publishedPosts[0]?.id).toBe("post-1")

    await store.getState().fetchPosts()
    expect(store.getState().error).toBeNull()
    expect(store.getState().publishedPosts[0]?.id).toBe("post-recovered")
  })
})
