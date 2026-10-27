import { buttonStepSchema } from "@chatbotx.io/flow-config"
import { describe, expect, test } from "vitest"
import { getButtonTemplate } from "../src/handlers/message/outgoing-message/send-button"

const callButton = (phoneNumber: string) =>
  ({
    id: "789",
    label: "Call Us",
    buttonType: "callPhoneNumber",
    beforeStep: { id: "790", stepType: "callPhoneNumber", phoneNumber },
    steps: [],
  }) as never

describe("callPhoneNumber button on Messenger", () => {
  test("renders a native phone_number button that dials the number", () => {
    expect(
      getButtonTemplate({
        flowId: "11638426147094528",
        button: callButton("+97672010111"),
      }),
    ).toEqual({
      type: "phone_number",
      title: "Call Us",
      payload: "+97672010111",
    })
  })

  test("adds the leading + Messenger requires when it was omitted", () => {
    const template = getButtonTemplate({
      flowId: "11638426147094528",
      button: callButton("97672010111"),
    })

    expect(template).toMatchObject({
      type: "phone_number",
      payload: "+97672010111",
    })
  })
})

describe("callPhoneNumber button schema", () => {
  const parse = (phoneNumber: string) =>
    buttonStepSchema.safeParse({
      id: "789",
      label: "Call Us",
      buttonType: "callPhoneNumber",
      beforeStep: { id: "790", stepType: "callPhoneNumber", phoneNumber },
      steps: [],
    })

  test("accepts an international number with or without +", () => {
    expect(parse("+97672010111").success).toBe(true)
    expect(parse("97672010111").success).toBe(true)
  })

  test("rejects numbers with spaces, letters or too few digits", () => {
    expect(parse("+976 7201 0111").success).toBe(false)
    expect(parse("call-me").success).toBe(false)
    expect(parse("123").success).toBe(false)
    expect(parse("").success).toBe(false)
  })
})
