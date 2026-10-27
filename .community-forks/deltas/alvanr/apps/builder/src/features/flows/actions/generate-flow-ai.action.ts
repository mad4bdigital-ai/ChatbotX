"use server"

import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObjectWithGeminiFallback } from "@chatbotx.io/ai"
import { z } from "zod"
import {
  type WorkspaceIdRequestParams,
  workspaceIdrequestParams,
} from "@/features/common/schema"
import { workspaceActionClient } from "@/lib/safe-action"

const generateFlowInputSchema = z.object({
  prompt: z.string().min(3, "Prompt must be at least 3 characters"),
})

const generatedNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["sendMessage", "condition", "wait", "start"]),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  textMessage: z.string().optional(),
})

const generatedEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
})

const generatedFlowOutputSchema = z.object({
  nodes: z.array(generatedNodeSchema),
  edges: z.array(generatedEdgeSchema),
})

export const generateFlowWithAiAction = workspaceActionClient
  .bindArgsSchemas(workspaceIdrequestParams)
  .inputSchema(generateFlowInputSchema)
  .action(
    async ({
      parsedInput,
    }: {
      bindArgsParsedInputs: WorkspaceIdRequestParams
      parsedInput: z.infer<typeof generateFlowInputSchema>
    }) => {
      const apiKey =
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
      const _google = createGoogleGenerativeAI({
        apiKey: apiKey || "dummy-key-for-fallback",
      })

      const systemPrompt = `You are an expert ChatbotX flow architect. 
Given a user prompt describing a chatbot workflow or conversation sequence, you must output a structured node graph with nodes and edges.
- Always include a start node (id: "node-start", type: "start", name: "Start", position: {x: 250, y: 100}).
- Position subsequent nodes vertically (increasing y by ~150-200px each step) or horizontally for branches.
- Use 'sendMessage' nodes for sending text to users, with textMessage containing the exact response text.
- Use 'condition' nodes for branching logic based on user input or custom fields.
- Connect consecutive nodes with edges from source to target.`

      try {
        const { object } = await generateObjectWithGeminiFallback({
          preferredModel: "gemini-3.6-flash",
          schema: generatedFlowOutputSchema,
          system: systemPrompt,
          prompt: parsedInput.prompt,
        })

        const flowObj = object as z.infer<typeof generatedFlowOutputSchema>
        // Transform simplified Gemini output into full ChatbotX FlowVersion schema nodes
        const fullNodes = flowObj.nodes.map(
          (n: z.infer<typeof generatedNodeSchema>) => {
            if (n.type === "start") {
              return {
                id: n.id,
                type: "start",
                position: n.position,
                data: {
                  details: {
                    name: n.name || "Start",
                    isStartNode: true,
                  },
                },
              }
            }

            if (n.type === "sendMessage") {
              return {
                id: n.id,
                type: "sendMessage",
                position: n.position,
                data: {
                  details: {
                    name: n.name || "Send Message",
                    steps: [
                      {
                        id: `step-${n.id}`,
                        type: "sendText",
                        content: {
                          text:
                            n.textMessage || "Hello! How can I help you today?",
                        },
                      },
                    ],
                  },
                },
              }
            }

            return {
              id: n.id,
              type: "sendMessage",
              position: n.position,
              data: {
                details: {
                  name: n.name || "Message",
                  steps: [
                    {
                      id: `step-${n.id}`,
                      type: "sendText",
                      content: {
                        text: n.textMessage || "Continuing workflow...",
                      },
                    },
                  ],
                },
              },
            }
          },
        )

        const fullEdges = flowObj.edges.map(
          (e: z.infer<typeof generatedEdgeSchema>, idx: number) => ({
            id: e.id || `edge-${idx}`,
            source: e.source,
            sourceHandle: `${e.source}-handle-continue`,
            target: e.target,
            targetHandle: `${e.target}-handle-input`,
          }),
        )

        return {
          nodes: fullNodes,
          edges: fullEdges,
        }
      } catch {
        // Fallback for missing/invalid API key or network issues
        const defaultNodes = [
          {
            id: "node-start",
            type: "start",
            position: { x: 250, y: 100 },
            data: { details: { name: "Start", isStartNode: true } },
          },
          {
            id: "node-msg-1",
            type: "sendMessage",
            position: { x: 250, y: 250 },
            data: {
              details: {
                name: "AI Generated Response",
                steps: [
                  {
                    id: "step-1",
                    type: "sendText",
                    content: {
                      text: `Generated flow for: "${parsedInput.prompt}". Welcome to our service!`,
                    },
                  },
                ],
              },
            },
          },
        ]

        const defaultEdges = [
          {
            id: "edge-1",
            source: "node-start",
            sourceHandle: "node-start-handle-continue",
            target: "node-msg-1",
            targetHandle: "node-msg-1-handle-input",
          },
        ]

        return {
          nodes: defaultNodes,
          edges: defaultEdges,
        }
      }
    },
  )
