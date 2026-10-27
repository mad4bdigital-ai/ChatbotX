import { describe, expect, test } from "vitest"
import { stripUnresolvedJsonValues } from "../src/external-request/strip-unresolved-json"

describe("external request JSON variable hygiene", () => {
  test("omits unresolved object properties but preserves resolved empty strings and primitive values", () => {
    const result = stripUnresolvedJsonValues(
      JSON.stringify({
        missing: "{{contact.unknown}}",
        embedded: "hello {{unknown}}",
        name: "",
        zero: 0,
        flag: false,
        intentionalNull: null,
        nested: { notFound: "{{other}}", keep: "ready" },
        array: [{ optional: "{{missing}}", keep: 5 }],
      }),
    )
    expect(JSON.parse(result)).toEqual({
      name: "",
      zero: 0,
      flag: false,
      intentionalNull: null,
      nested: { keep: "ready" },
      array: [{ keep: 5 }],
    })
  })

  test("preserves invalid JSON so the existing validation path can reject it", () => {
    expect(stripUnresolvedJsonValues('{"bad":')).toBe('{"bad":')
  })

  test("preserves JSON strings with no unresolved placeholders", () => {
    expect(stripUnresolvedJsonValues('{"message":"Hello!","note":" "}')).toBe(
      '{"message":"Hello!","note":" "}',
    )
  })

  test("does not modify array positions", () => {
    expect(
      stripUnresolvedJsonValues('[0,false,"",{"missing":"{{token}}"}]'),
    ).toBe('[0,false,"",{}]')
  })
})
