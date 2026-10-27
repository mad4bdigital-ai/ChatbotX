import { describe, expect, test } from "vitest"
import { convertButtonsToTemplate } from "../src/chat/handlers/send-flow-step"

describe("convertButtonsToTemplate — callPhoneNumber", () => {
  test("records a dial button as a tel: link on the Message row", () => {
    const [template] = convertButtonsToTemplate({
      flowId: "11638426147094528",
      buttons: [
        {
          id: "789",
          label: "Call Us",
          buttonType: "callPhoneNumber",
          beforeStep: {
            id: "790",
            stepType: "callPhoneNumber",
            phoneNumber: "97672010111",
          },
          steps: [],
        },
      ],
    })

    expect(template).toMatchObject({
      id: "789",
      label: "Call Us",
      buttonType: "url",
      url: "tel:+97672010111",
    })
  })
})
