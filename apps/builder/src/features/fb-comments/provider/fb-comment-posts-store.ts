import { createStore } from "zustand/vanilla"
import { client } from "@/lib/orpc/orpc"

export type FacebookPost = {
  id: string
  message?: string
  full_picture?: string
  created_time: string
  permalink_url?: string
  media_product_type?: string
  pageId: string
  inboxId: string
}

export type FacebookPage = {
  id: string
  name: string
}

export type FbCommentPostsState = {
  loading: boolean
  error: string | null
  initialized: boolean

  workspaceId: string
  publishedPosts: FacebookPost[]
  adsPosts: FacebookPost[]
  reelsPosts: FacebookPost[]
  pages: FacebookPage[]
}

export type FbCommentPostsActions = {
  initialize: () => Promise<void>
  fetchPosts: () => Promise<void>
}

export type FbCommentPostsStore = FbCommentPostsState & FbCommentPostsActions

export const createFbCommentPostsStore = (
  props: Partial<FbCommentPostsState> & { workspaceId: string },
) =>
  createStore<FbCommentPostsStore>((set, get) => ({
    loading: false,
    error: null,
    initialized: false,

    publishedPosts: [],
    adsPosts: [],
    reelsPosts: [],
    pages: [],
    ...props,

    initialize: async () => {
      if (get().initialized || get().loading) {
        return
      }
      await get().fetchPosts()
    },

    fetchPosts: async () => {
      // The provider initializes on mount and the dialog refreshes on open.
      // Avoid two simultaneous Graph calls when the dialog opens immediately.
      if (get().loading) {
        return
      }
      const { workspaceId } = get()
      set({ loading: true, error: null })
      try {
        const { published, ads, reels, pages } =
          await client.fbCommentsAPI.facebookPostsAPI({ workspaceId })
        set({
          publishedPosts: published,
          adsPosts: ads,
          reelsPosts: reels,
          pages,
        })
      } catch (error: unknown) {
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch Facebook posts",
        })
      } finally {
        set({ loading: false, initialized: true })
      }
    },
  }))
