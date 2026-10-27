// @vitest-environment node

import { describe, expect, test } from "vitest"
import {
  generateAuthUrl,
  hasInstagramManageCommentsScope,
  INSTAGRAM_MANAGE_COMMENTS_SCOPE,
} from "../src/apis/auth"

describe("Instagram Facebook scopes", () => {
  test("INSTAGRAM_MANAGE_COMMENTS_SCOPE equals instagram_manage_comments", () => {
    expect(INSTAGRAM_MANAGE_COMMENTS_SCOPE).toBe("instagram_manage_comments")
  })

  test("hasInstagramManageCommentsScope checks for instagram_manage_comments scope", () => {
    expect(
      hasInstagramManageCommentsScope([
        "instagram_basic",
        "instagram_manage_comments",
      ]),
    ).toBe(true)
    expect(
      hasInstagramManageCommentsScope(["instagram_basic", "pages_messaging"]),
    ).toBe(false)
    expect(hasInstagramManageCommentsScope(undefined)).toBe(false)
  })

  test("generateAuthUrl includes instagram_manage_comments in scope searchParam", () => {
    const url = generateAuthUrl({
      clientId: "test-client-id",
      redirectUrl: "https://example.com/callback",
    })

    const parsedUrl = new URL(url)
    const scopeParam = parsedUrl.searchParams.get("scope") ?? ""
    expect(scopeParam).toContain("instagram_manage_comments")
  })
})
