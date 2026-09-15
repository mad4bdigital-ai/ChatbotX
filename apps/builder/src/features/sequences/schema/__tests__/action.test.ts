import { describe, expect, test } from "vitest"
import { updateSequenceSchema } from "../action"

describe("updateSequenceSchema", () => {
  test("preserves an explicit false stopOnReply value", () => {
    expect(updateSequenceSchema.parse({ stopOnReply: false })).toEqual({
      stopOnReply: false,
    })
  })
})
