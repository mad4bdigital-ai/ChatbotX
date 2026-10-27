import { describe, expect, test } from "vitest"
import {
  buildCallLinkUrl,
  resolveCallLinkNumber,
  toDialablePhoneNumber,
} from "../src/open-link/call"

describe("call link", () => {
  test("builds the /call page URL with a dialable number", () => {
    expect(
      buildCallLinkUrl({
        appUrl: "https://chatbot.example.com",
        phoneNumber: "97672010111",
      }),
    ).toBe("https://chatbot.example.com/call?n=%2B97672010111")
  })

  test("normalises numbers to +<digits>", () => {
    expect(toDialablePhoneNumber(" 97672010111 ")).toBe("+97672010111")
    expect(toDialablePhoneNumber("+97672010111")).toBe("+97672010111")
  })

  test("resolves only plain international numbers", () => {
    expect(resolveCallLinkNumber("+97672010111")).toBe("+97672010111")
    expect(resolveCallLinkNumber("97672010111")).toBe("+97672010111")
    expect(resolveCallLinkNumber("javascript:alert(1)")).toBeNull()
    expect(resolveCallLinkNumber("+976 7201 0111")).toBeNull()
    expect(resolveCallLinkNumber("")).toBeNull()
    expect(resolveCallLinkNumber(undefined)).toBeNull()
  })
})
