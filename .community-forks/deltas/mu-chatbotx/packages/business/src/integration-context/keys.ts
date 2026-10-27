import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const integrationContextEnv = () =>
  createEnv({
    server: {
      NEXT_PUBLIC_EDITION: z
        .enum(["community", "enterprise", "cloud"])
        .default("community"),
      NEXT_PUBLIC_BUILDER_URL: z.url().default("http://localhost:3123"),
      NEXT_PUBLIC_STORAGE_URL: z.url().optional(),
      FORCE_PUBLIC_HTTPS: z.stringbool().optional().default(false),
      REALTIME_BROADCAST_SECRET: z.string().min(32),
      REALTIME_INTERNAL_URL: z.url().optional(),
      REALTIME_DELIVERY_GATE: z.stringbool().optional().default(true),
      // Default platform/brand name (browser tab title, emails) when no tenant
      // branding overrides it.
      PLATFORM_NAME: z.string().min(1).optional(),
    },
    runtimeEnv: process.env,
    skipValidation: process.env.SKIP_ENV_CHECK === "true",
  })
