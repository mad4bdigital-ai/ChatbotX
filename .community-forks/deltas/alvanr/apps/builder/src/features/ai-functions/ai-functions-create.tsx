"use client"

import type { AIFunctionModel } from "@chatbotx.io/database/types"
import { ComboboxField } from "@chatbotx.io/ui/components/form/combobox-field"
import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { TextareaField } from "@chatbotx.io/ui/components/form/textarea-field"
import { Button } from "@chatbotx.io/ui/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@chatbotx.io/ui/components/ui/dialog"
import { Form } from "@chatbotx.io/ui/components/ui/form"
import { Textarea } from "@chatbotx.io/ui/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import {
  Loader2Icon,
  MoveRightIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useFieldArray } from "react-hook-form"
import { toast } from "sonner"
import CustomFieldField from "../custom-fields/components/custom-field-field"
import { useFlowSelectOptions } from "../flows/provider/flow-hook"
import { createAIFunctionAction } from "./actions/create-ai-function.action"
import { generateAIFunctionAiAction } from "./actions/generate-ai-function-ai.action"
import { updateAIFunctionAction } from "./actions/update-ai-function.action"
import { createAIFunctionRequest } from "./schema/action"

type AIFunctionsCreateProps = {
  workspaceId: string
  onSuccess?: () => void
  mode?: "create" | "edit" | "duplicate"
  initialData?: AIFunctionModel
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AIFunctionsCreate({
  workspaceId,
  onSuccess,
  mode = "create",
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AIFunctionsCreateProps) {
  const t = useTranslations()

  const [internalOpen, setInternalOpen] = useState(false)
  const isOpen = controlledOpen ?? internalOpen
  const setIsOpen = setControlledOpen ?? setInternalOpen

  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      return
    }
    setIsGeneratingAi(true)
    try {
      const res = await generateAIFunctionAiAction(workspaceId, {
        prompt: aiPrompt.trim(),
      })
      if (res?.data) {
        form.setValue("name", res.data.name, { shouldValidate: true })
        form.setValue("purpose", res.data.purpose, { shouldValidate: true })
        form.setValue("outputMessage", res.data.outputMessage, {
          shouldValidate: true,
        })
        if (res.data.dataCollect && res.data.dataCollect.length > 0) {
          form.setValue("dataCollect", res.data.dataCollect, {
            shouldValidate: true,
          })
        }
        toast.success("AI Function configured with Gemini!")
      } else {
        toast.error(res?.serverError || "Failed to generate AI function")
      }
    } catch {
      toast.error("Failed to generate AI function configuration")
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const flowOptions = useFlowSelectOptions()

  const action =
    mode === "edit" && initialData
      ? updateAIFunctionAction.bind(null, workspaceId, initialData.id)
      : createAIFunctionAction.bind(null, workspaceId)

  const { form, handleSubmitWithAction, resetFormAndAction } =
    useHookFormAction(action, zodResolver(createAIFunctionRequest), {
      formProps: {
        mode: "onChange",
        defaultValues: {
          name: "",
          purpose: "",
          dataCollect: [],
          outputMessage: "",
          triggerFlowId: null,
        },
      },
      actionProps: {
        onSuccess: () => {
          toast.success(
            t(
              `messages.${mode === "edit" ? "updatedSuccess" : "createdSuccess"}`,
              {
                feature: t("fields.aiFunction.label"),
              },
            ),
          )
          resetFormAndAction()
          setIsOpen(false)
          onSuccess?.()
        },
        onError: ({ error }) => {
          if (error.serverError) {
            toast.error(error.serverError)
          }
        },
      },
      errorMapProps: {},
    })

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (initialData) {
      form.reset({
        name:
          mode === "duplicate"
            ? `${initialData.name} (copy)`
            : initialData.name,
        purpose: initialData.purpose ?? "",
        dataCollect:
          (initialData.dataCollect as { from: string; to: string }[]) ?? [],
        outputMessage: initialData.outputMessage ?? "",
        triggerFlowId: initialData.triggerFlowId,
      })
    } else {
      form.reset({
        name: "",
        purpose: "",
        dataCollect: [],
        outputMessage: "",
        triggerFlowId: null,
      })
    }
  }, [isOpen, initialData, form, mode])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "dataCollect",
  })

  let titleKey = "messages.createFeature"
  if (mode === "edit") {
    titleKey = "messages.editFeature"
  }
  if (mode === "duplicate") {
    titleKey = "messages.duplicateFeature"
  }

  const title = t(titleKey, { feature: t("fields.aiFunction.label") })

  const trigger = controlledOpen === undefined && (
    <DialogTrigger
      render={
        <Button>
          <PlusIcon className="h-4 w-4" />
          {t("actions.createFeature", {
            feature: t("fields.aiFunction.label"),
          })}
        </Button>
      }
    />
  )

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      {trigger}
      <DialogContent className={"max-h-screen overflow-y-scroll lg:max-w-5xl"}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col space-y-6 py-4"
            onSubmit={handleSubmitWithAction}
          >
            <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-primary text-sm">
                  <SparklesIcon className="h-4 w-4 animate-pulse text-amber-500" />
                  <span>Generate Function Parameters with Gemini AI</span>
                </div>
                <span className="font-mono text-muted-foreground text-xs">
                  Gemini 3.6 Flash
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                Instruct Gemini to build this tool function for you (e.g.
                &quot;Collect customer email and order ID to check shipment
                status&quot;):
              </p>
              <div className="flex gap-2">
                <Textarea
                  className="min-h-[60px] bg-background text-xs"
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Type your instructions for Gemini AI..."
                  value={aiPrompt}
                />
                <Button
                  className="gap-1.5 self-end whitespace-nowrap"
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  onClick={handleGenerateAi}
                  type="button"
                  variant="default"
                >
                  {isGeneratingAi ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4 text-amber-300" />
                  )}
                  Build with AI
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="self-center text-[11px] text-muted-foreground">
                  Presets:
                </span>
                {[
                  "Book an appointment with customer name & date",
                  "Check order shipment status with order ID & email",
                  "Collect lead info (name, phone number, company)",
                ].map((preset) => (
                  <button
                    className="rounded border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                    key={preset}
                    onClick={() => setAiPrompt(preset)}
                    type="button"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label={t("fields.name.label")}
              name="name"
              placeholder={t("fields.name.placeholder")}
              required
            />
            <TextareaField
              label={t("fields.purpose.label")}
              name="purpose"
              placeholder={t("fields.purpose.placeholder")}
            />
            <div className="space-y-2">
              <div className="font-medium text-sm">
                {t("fields.dataCollect.label")}
              </div>
              {fields.map((field, index) => (
                <div className="mt-2 flex items-start gap-2" key={field.id}>
                  <InputField
                    name={`dataCollect.${index}.from`}
                    placeholder="Attribute"
                  />
                  <MoveRightIcon className="size-10" />
                  <CustomFieldField
                    emptyText={t("actions.noRecordFound")}
                    name={`dataCollect.${index}.to`}
                    placeholder={t("actions.pleaseSelect")}
                  />
                  <Button
                    onClick={() => remove(index)}
                    type="button"
                    variant="outline"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                onClick={() => append({ from: "", to: "" })}
                type="button"
                variant="outline"
              >
                <PlusIcon className="h-4 w-4" />
                {t("actions.addMore")}
              </Button>
            </div>
            <TextareaField
              label={t("fields.outputMessage.label")}
              name="outputMessage"
              placeholder={t("fields.outputMessage.placeholder")}
            />
            <ComboboxField
              emptyText={t("actions.noRecordFound")}
              label={t("fields.triggerFlowId.label")}
              name="triggerFlowId"
              options={flowOptions}
              placeholder={t("fields.triggerFlowId.placeholder")}
            />

            <DialogFooter className="gap-2 sm:space-x-0">
              <DialogClose
                render={<Button variant="ghost">{t("actions.cancel")}</Button>}
              />

              <Button
                disabled={
                  !form.formState.isValid || form.formState.isSubmitting
                }
                type="submit"
              >
                {form.formState.isSubmitting && (
                  <Loader2Icon className="animate-spin" />
                )}
                {t("actions.confirm")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
