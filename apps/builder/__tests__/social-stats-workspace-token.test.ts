// @vitest-environment node
import { describe, expect, test, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const routes: {
    config: { method: string; path: string }
    input?: { parse: (x: unknown) => unknown }
    handler?: (args: {
      context: { workspace: { id: string } }
      input: { days: number; workspaceId?: string }
    }) => Promise<unknown>
  }[] = []
  const scopes: string[] = []
  const handlers = {
    instagram: vi.fn(async (workspace: string) => workspace),
    facebook: vi.fn(async (workspace: string) => workspace),
    tiktok: vi.fn(async (workspace: string) => workspace),
  }
  return { routes, scopes, handlers }
})

vi.mock("@/orpc", () => ({
  workspaceTokenAuthAPIForScope: (scope: string) => {
    mocks.scopes.push(scope)
    return {
      route: (config: { method: string; path: string }) => {
        const route: (typeof mocks.routes)[number] = { config }
        mocks.routes.push(route)
        const chain = {
          input: (schema: typeof route.input) => {
            route.input = schema
            return chain
          },
          output: () => chain,
          errors: () => chain,
          handler: (fn: typeof route.handler) => {
            route.handler = fn
            return route
          },
        }
        return chain
      },
    }
  },
}))
vi.mock("@/features/social-stats/queries", () => ({
  instagramOverview: mocks.handlers.instagram,
  facebookOverview: mocks.handlers.facebook,
  tiktokOverview: mocks.handlers.tiktok,
}))

await import("../src/features/social-stats/api")

describe("social statistics token isolation", () => {
  const cases = [
    ["instagram", mocks.handlers.instagram],
    ["facebook", mocks.handlers.facebook],
    ["tiktok", mocks.handlers.tiktok],
  ] as const

  test("all social metrics procedures use the current analytics scope", () => {
    expect(mocks.scopes).toEqual(["analytics"])
    expect(mocks.routes).toHaveLength(3)
    expect(mocks.routes.map((route) => route.config.method)).toEqual([
      "GET",
      "GET",
      "GET",
    ])
  })

  for (const [channel, handler] of cases) {
    test(
      [
        channel,
        " uses the authenticated token workspace, never a caller workspace",
      ].join(""),
      async () => {
        const route = mocks.routes.find(
          (r) => r.config.path.split("/").at(-1) === channel,
        )
        expect(route?.handler).toBeDefined()
        await route?.handler?.({
          context: { workspace: { id: "trusted-workspace" } },
          input: { days: 7, workspaceId: "attacker-workspace" },
        })
        expect(handler).toHaveBeenLastCalledWith("trusted-workspace", 7)
      },
    )
    test([channel, " rejects unbounded time windows"].join(""), () => {
      const route = mocks.routes.find(
        (r) => r.config.path.split("/").at(-1) === channel,
      )
      expect(route?.input).toBeDefined()
      expect(() => route?.input?.parse({ days: 91 })).toThrow()
      expect(() => route?.input?.parse({ days: -1 })).toThrow()
      expect(route?.input?.parse({ days: 7 })).toEqual({ days: 7 })
    })
  }
})
