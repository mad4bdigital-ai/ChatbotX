"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Textarea } from "@chatbotx.io/ui/components/ui/textarea"
import { useReactFlow } from "@xyflow/react"
import { BotIcon, Loader2Icon, SparklesIcon } from "lucide-react"
import { useAction } from "next-safe-action/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { generateFlowWithAiAction } from "../actions/generate-flow-ai.action"

const PRESET_PROMPTS = [
  "WhatsApp lead capture flow requesting name, email, and phone number",
  "E-commerce order status inquiry bot with automated tracking lookups",
  "Appointment booking assistant flow with calendar availability check",
]

type GenerateFlowAiDialogProps = {
  workspaceId: string
  trigger?: React.ReactElement
  onGenerated?: (nodes: unknown[], edges: unknown[]) => void
}

export function GenerateFlowAiDialog({
  workspaceId,
  trigger,
  onGenerated,
}: GenerateFlowAiDialogProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const { setNodes, setEdges } = useReactFlow()

  const generateAction = useAction(
    generateFlowWithAiAction.bind(null, workspaceId),
    {
      onSuccess: ({ data }) => {
        if (data?.nodes && data?.edges) {
          if (onGenerated) {
            onGenerated(data.nodes, data.edges)
          } else {
            setNodes(data.nodes)
            setEdges(data.edges)
          }
          toast.success("Flow generated successfully with Gemini AI!")
          setOpen(false)
          setPrompt("")
        }
      },
      onError: ({ error }) => {
        toast.error(error.serverError || "Failed to generate flow with AI")
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) {
      return
    }
    generateAction.execute({ prompt: prompt.trim() })
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          trigger || (
            <Button
              className="gap-2 border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
              size="sm"
              variant="outline"
            >
              <SparklesIcon className="h-4 w-4 animate-pulse text-amber-500" />
              <span>Generate with AI</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[550px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              Build Workflow with Gemini AI
            </DialogTitle>
            <DialogDescription>
              Instruct Gemini to design a complete chatbot flow for your use
              case.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Textarea
              className="resize-none text-sm"
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create a WhatsApp lead generation flow that asks for the customer's name, email, and preferred appointment time..."
              rows={4}
              value={prompt}
            />

            <div>
              <p className="mb-2 flex items-center gap-1 font-medium text-muted-foreground text-xs">
                <BotIcon className="h-3.5 w-3.5" /> Quick Preset Prompts:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PROMPTS.map((p) => (
                  <button
                    className="rounded-md bg-secondary/80 px-2.5 py-1 text-left text-secondary-foreground text-xs transition-colors hover:bg-secondary"
                    key={p}
                    onClick={() => setPrompt(p)}
                    type="button"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={generateAction.isPending}
              onClick={() => setOpen(false)}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-gradient-to-r from-amber-500 to-primary text-white"
              disabled={!prompt.trim() || generateAction.isPending}
              type="submit"
            >
              {generateAction.isPending ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Generating Flow...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  Generate Flow
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
