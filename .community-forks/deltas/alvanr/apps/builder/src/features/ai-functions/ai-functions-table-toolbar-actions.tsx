"use client"

import { Button } from "@chatbotx.io/ui/components/ui/button"
import { SparklesIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AIFunctionsCreate } from "./ai-functions-create"

type AIFunctionsTableToolbarActionsProps = {
  workspaceId: string
}

export function AIFunctionsTableToolbarActions({
  workspaceId,
}: AIFunctionsTableToolbarActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Button
        className="gap-2 border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        onClick={() => setOpen(true)}
        variant="outline"
      >
        <SparklesIcon className="h-4 w-4 animate-pulse text-amber-500" />
        <span>Generate Function with AI</span>
      </Button>

      <AIFunctionsCreate
        onOpenChange={setOpen}
        onSuccess={() => {
          router.refresh()
        }}
        open={open}
        workspaceId={workspaceId}
      />
    </div>
  )
}
