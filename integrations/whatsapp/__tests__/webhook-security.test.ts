import { createHmac } from "node:crypto"
import { beforeEach, describe, expect, test, vi } from "vitest"
import { webhookHandler } from "../src/handlers/webhook"

const APP_SECRET = "test-app-secret"
const VERIFY_TOKEN = "verify-token"

const buildPayload = () => ({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "waba-1",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "15550000000",
              phone_number_id: "phone-1",
            },
            contacts: [
              {
                profile: { name: "Lead" },
                wa_id: "15551234567",
              },
            ],
            messages: [
              {
                from: "15551234567",
                id: "wamid.test-1",
                timestamp: "1710000000",
                text: { body: "hello" },
                type: "text",
              },
            ],
          },
        },
      ],
    },
  ],
})

const sign = (body: string, secret = APP_SECRET) =>
  `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`

const buildRequest = (body: string, signature: string) =>
  new Request("https://example.com/integrations/whatsapp/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-hub-signature-256": signature,
    },
    body,
  })

describe("WhatsApp webhook HMAC enforcement", () => {
  const queueAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test("accepts a correctly signed raw request and dispatches the message", async () => {
    const body = JSON.stringify(buildPayload())

    await expect(
      webhookHandler({
        config: {
          clientSecret: APP_SECRET,
          verifyToken: VERIFY_TOKEN,
        },
        req: buildRequest(body, sign(body)),
        queue: { add: queueAdd },
      } as unknown as Parameters<typeof webhookHandler>[0]),
    ).resolves.toBe("ok")

    expect(queueAdd).toHaveBeenCalledWith(
      "incomingMessage",
      expect.objectContaining({
        type: "incomingMessage",
        data: expect.objectContaining({
          integrationType: "whatsapp",
          integrationIdentifier: "phone-1",
        }),
      }),
    )
  })

  test("rejects a forged signature before anything is queued", async () => {
    const body = JSON.stringify(buildPayload())

    await expect(
      webhookHandler({
        config: {
          clientSecret: APP_SECRET,
          verifyToken: VERIFY_TOKEN,
        },
        req: buildRequest(body, sign(body, "wrong-secret")),
        queue: { add: queueAdd },
      } as unknown as Parameters<typeof webhookHandler>[0]),
    ).rejects.toThrow("Failed to handle webhook")

    expect(queueAdd).not.toHaveBeenCalled()
  })

  test("fails closed when POST authentication secret is missing", async () => {
    const body = JSON.stringify(buildPayload())

    await expect(
      webhookHandler({
        config: { verifyToken: VERIFY_TOKEN },
        req: buildRequest(body, sign(body)),
        queue: { add: queueAdd },
      } as unknown as Parameters<typeof webhookHandler>[0]),
    ).rejects.toThrow("Failed to handle webhook")

    expect(queueAdd).not.toHaveBeenCalled()
  })
})
