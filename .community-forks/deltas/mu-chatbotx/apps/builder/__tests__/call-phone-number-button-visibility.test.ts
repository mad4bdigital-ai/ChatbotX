import { describe, expect, test } from "vitest"
import { canOfferCallPhoneNumberButton } from "@/features/flows/react-flow/steps/button-config"

describe("canOfferCallPhoneNumberButton", () => {
  test("offers the dial button on Messenger, Instagram and omnichannel nodes", () => {
    for (const channel of [
      "messenger",
      "instagram",
      "omnichannel",
      undefined,
    ]) {
      expect(
        canOfferCallPhoneNumberButton({ channel, isQuickReply: false }),
      ).toBe(true)
    }
  })

  test("hides it on nodes pinned to a channel without a dial button", () => {
    for (const channel of ["telegram", "whatsapp", "webchat", "zalo"]) {
      expect(
        canOfferCallPhoneNumberButton({ channel, isQuickReply: false }),
      ).toBe(false)
    }
  })

  test("never offers it as a quick reply, even on Messenger", () => {
    expect(
      canOfferCallPhoneNumberButton({
        channel: "messenger",
        isQuickReply: true,
      }),
    ).toBe(false)
  })
})
