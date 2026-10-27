import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

/**
 * Hoisted mock handles. `vi.mock` factories run before module top-level, so any
 * value a factory references must be created with `vi.hoisted`.
 */
const { listActiveDomains, betterAuthMock } = vi.hoisted(() => ({
  listActiveDomains: vi.fn(),
  betterAuthMock: vi.fn((config: Record<string, unknown>) => config),
}))

// better-auth's real init eagerly resolves `trustedOrigins` at instance
// creation, which is the exact behavior under test (see server.ts). Stub it
// to just hand back the config object so we can extract and call the
// `trustedOrigins` thunk ourselves without booting a real better-auth instance.
vi.mock("better-auth", async () => {
  const actual =
    await vi.importActual<typeof import("better-auth")>("better-auth")
  return {
    ...actual,
    betterAuth: betterAuthMock,
  }
})

vi.mock("better-auth/adapters/drizzle", () => ({
  drizzleAdapter: () => ({}),
}))

vi.mock("better-auth/next-js", () => ({
  nextCookies: () => ({ id: "next-cookies" }),
}))

vi.mock("better-auth/plugins", () => ({
  anonymous: () => ({ id: "anonymous" }),
  bearer: () => ({ id: "bearer" }),
  magicLink: () => ({ id: "magic-link" }),
  oneTimeToken: () => ({ id: "one-time-token" }),
}))

vi.mock("@chatbotx.io/database/client", () => ({
  db: {},
}))

vi.mock("@chatbotx.io/database/schema", () => ({
  accountModel: {},
  sessionModel: {},
  userModel: {},
  verificationModel: {},
}))

vi.mock("@chatbotx.io/business", () => ({
  customDomainService: { listActiveDomains },
  platformCredentialService: {
    findDecryptedPlatform: vi.fn(),
    findPlatform: vi.fn(),
  },
  resolveTenantSettingsByDomain: vi.fn(),
}))

// @chatbotx.io/utils sets up a process-global Snowflake ID generator at
// module scope; re-importing it after `vi.resetModules()` collides on the
// same "Place ID" and throws. Stub it since these tests never generate ids.
vi.mock("@chatbotx.io/utils", () => ({
  createId: () => "11724110378894669",
  getPublicOriginFromRequest: vi.fn(),
}))

vi.mock("@chatbotx.io/mail", () => ({
  DEFAULT_FORGOT_PASSWORD_SUBJECT: "reset",
  DEFAULT_MAGIC_LINK_SUBJECT: "magic",
  DEFAULT_SIGNUP_SUBJECT: "signup",
  sendMagicLink: vi.fn(),
  sendResetPassword: vi.fn(),
  sendSignUpVerification: vi.fn(),
}))

describe("better-auth id generation", () => {
  beforeEach(() => {
    vi.resetModules()
    betterAuthMock.mockClear()
    vi.stubEnv("SKIP_ENV_CHECK", "true")
    vi.stubEnv("NEXT_PUBLIC_BUILDER_URL", "https://app.example.com")
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret")
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test("does not use numeric (serial) ids, which corrupt odd snowflake ids", async () => {
    // Snowflake ids sit above Number.MAX_SAFE_INTEGER, where only even
    // integers are representable: coercing one to a number silently changes it.
    expect(String(Number("11724110378894669"))).toBe("11724110378894668")

    const { createAuth } = await import("../src/server")
    createAuth({})

    const config = betterAuthMock.mock.calls[0]?.[0] as {
      advanced: { database: { generateId: unknown } }
    }
    const generateId = config.advanced.database.generateId

    expect(generateId).not.toBe("serial")
    expect(typeof generateId).toBe("function")
    // Same snowflake generator the schema's $defaultFn uses, kept as a string.
    expect((generateId as () => unknown)()).toBe("11724110378894669")
  })
})
