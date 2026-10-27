import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const keys = () =>
  createEnv({
    server: {
      REDIS_URL: z.url().default("redis://localhost:6379"),
      REDIS_CACHE_URL: z.url().optional(),
      REDIS_SEQUENCE_URL: z.url().optional(),
    },
    runtimeEnv: process.env,
    skipValidation:
      process.env.SKIP_ENV_CHECK === "true" ||
      process.env.SKIP_ENV_CHECK === "1" ||
      process.env.NEXT_PHASE === "phase-production-build",
  })
