// @vitest-environment node
import { describe, expect, test, vi } from "vitest"

vi.mock("@/lib/orpc/orpc", () => ({ client: {} }))

import {
  type InstagramPost,
  isInstagramReel,
  splitInstagramMediaPosts,
} from "../src/features/ig-comments/provider/ig-comment-posts-store"

const post = (
  id: string,
  media_product_type?: string,
  media_type?: string,
): InstagramPost => ({
  id,
  media_product_type,
  media_type,
  created_time: "2026-10-27",
  accountId: "ig-account-1",
  inboxId: "inbox-1",
})

describe("Instagram comment post picker classification", () => {
  test("recognizes product-labeled Reels and CLIPS, case-insensitively", () => {
    expect(isInstagramReel(post("one", "REELS"))).toBe(true)
    expect(isInstagramReel(post("two", "clips"))).toBe(true)
  })

  test("uses video media type only if Graph omitted product type", () => {
    expect(isInstagramReel(post("fallback", undefined, "VIDEO"))).toBe(true)
    expect(isInstagramReel(post("feed-video", "FEED", "VIDEO"))).toBe(false)
  })

  test("each post appears in exactly one tab, preserving the source order", () => {
    const result = splitInstagramMediaPosts([
      post("image", "FEED", "IMAGE"),
      post("reel", "REELS", "VIDEO"),
      post("feed-video", "FEED", "VIDEO"),
      post("clip", "CLIPS", "VIDEO"),
      post("video-only", undefined, "VIDEO"),
      post("carousel", undefined, "CAROUSEL_ALBUM"),
    ])
    expect(result.published.map((x) => x.id)).toEqual([
      "image",
      "feed-video",
      "carousel",
    ])
    expect(result.reels.map((x) => x.id)).toEqual([
      "reel",
      "clip",
      "video-only",
    ])
  })
})
