import { createId, zodBigintAsString } from "@chatbotx.io/utils"
import { z } from "zod"
import { stepTypes } from "./step-action"

/**
 * E.164-style number Messenger's `phone_number` button dials: an optional
 * leading `+` followed by 6–15 digits, no spaces or punctuation.
 */
export const PHONE_NUMBER_PATTERN = /^\+?[0-9]{6,15}$/

export const callPhoneNumberStepSchema = z.object({
  id: zodBigintAsString(),
  stepType: z.literal(stepTypes.enum.callPhoneNumber),
  phoneNumber: z.string().trim().regex(PHONE_NUMBER_PATTERN),
})

export type CallPhoneNumberStepSchema = z.infer<
  typeof callPhoneNumberStepSchema
>

export const callPhoneNumberStepDefaultFn = (): CallPhoneNumberStepSchema => ({
  id: createId(),
  stepType: stepTypes.enum.callPhoneNumber,
  phoneNumber: "",
})
