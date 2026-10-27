"use server"

import { generateObjectWithGeminiFallback } from "@chatbotx.io/ai"
import { z } from "zod"
import { workspaceIdrequestParams } from "@/features/common/schema"
import { workspaceActionClient } from "@/lib/safe-action"

export const generatedAIFunctionOutputSchema = z.object({
  name: z
    .string()
    .describe(
      "Short descriptive function name for AI Agent tool call, e.g. 'book_appointment', 'check_order_status', 'collect_lead_info'",
    ),
  purpose: z
    .string()
    .describe(
      "Detailed explanation of when and why the AI Agent should execute this tool function during conversation",
    ),
  dataCollect: z
    .array(
      z.object({
        from: z
          .string()
          .describe(
            "Attribute parameter key to extract from user, e.g. 'email', 'phone', 'location'",
          ),
        to: z
          .string()
          .describe(
            "Target custom field variable name to store this attribute",
          ),
      }),
    )
    .describe(
      "List of data attributes to collect from the customer before executing function",
    ),
  outputMessage: z
    .string()
    .describe(
      "User-facing response template or confirmation message to return after function executes",
    ),
})

const generateAIFunctionAiRequest = z.object({
  prompt: z.string().trim().min(3),
})

export const generateAIFunctionAiAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(generateAIFunctionAiRequest)
  .action(async ({ parsedInput }) => {
    const systemPrompt = `You are an AI Function & Workflow Architect for ChatbotX.
Your job is to convert user natural language instructions into structured parameters for an AI Agent Tool Function.

Return a JSON object containing:
- name: function name
- purpose: purpose description for the AI Agent
- dataCollect: array of { from, to } parameter mappings
- outputMessage: template confirmation response for the user`

    try {
      const { object } = await generateObjectWithGeminiFallback({
        preferredModel: "gemini-3.6-flash",
        schema: generatedAIFunctionOutputSchema,
        system: systemPrompt,
        prompt: parsedInput.prompt,
      })

      const funcObj = object as z.infer<typeof generatedAIFunctionOutputSchema>

      return {
        name: funcObj.name,
        purpose: funcObj.purpose,
        dataCollect: funcObj.dataCollect || [],
        outputMessage: funcObj.outputMessage,
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate AI Function"
      throw new Error(errorMessage)
    }
  })
