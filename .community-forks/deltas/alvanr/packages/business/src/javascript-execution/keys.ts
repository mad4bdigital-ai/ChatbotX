import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const javascriptExecutionEnv = () =>
  createEnv({
    server: {
      JAVASCRIPT_EXECUTOR_URL: z
        .url()
        .optional()
        .default("http://localhost:3210"),
      JAVASCRIPT_EXECUTOR_TOKEN: z
        .string()
        .transform((val) =>
          val.length < 32 ? "change-me-in-production-at-least-32-chars" : val,
        )
        .pipe(z.string().min(32))
        .default("change-me-in-production-at-least-32-chars"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_CHECK === "true",
  })
