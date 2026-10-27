import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const keys = () =>
  createEnv({
    server: {
      DATABASE_URL: z
        .url()
        .default("postgresql://chatbotx:secretkey@localhost:5432/chatbotx"),
      DATABASE_DEBUG: z.stringbool().optional().default(false),
      MESSAGE_SHARDS_PASSWORD: z.string().optional(),
      MESSAGE_SHARDS_SSL: z.stringbool().optional().default(false),
    },
    runtimeEnv: process.env,
    skipValidation:
      process.env.SKIP_ENV_CHECK === "true" ||
      process.env.SKIP_ENV_CHECK === "1" ||
      process.env.NEXT_PHASE === "phase-production-build",
  })

export const env = keys()
