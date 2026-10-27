import { createEnv } from "@t3-oss/env-core"
import { z } from "zod"

export const keys = () =>
  createEnv({
    server: {
      SMTP_SERVER: z
        .url()
        .min(1)
        .default("smtp://username:password@localhost:1025"),
      SMTP_FROM: z.string().min(1).default("noreply@localhost"),
    },
    runtimeEnv: {
      SMTP_SERVER:
        process.env.SMTP_SERVER || "smtp://username:password@localhost:1025",
      SMTP_FROM: process.env.SMTP_FROM || "noreply@localhost",
    },
    emptyStringAsUndefined: true,
    skipValidation: process.env.SKIP_ENV_CHECK === "true",
  })

export const mailEnv = keys()
