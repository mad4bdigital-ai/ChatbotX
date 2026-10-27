"use client"

import { InputField } from "@chatbotx.io/ui/components/form/input-field"
import { PhoneIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { BaseStepEditor } from "../base/editor"

type CallPhoneNumberStepEditorProps = {
  parentName: string
}

const CallPhoneNumberStepEditor = ({
  parentName,
}: CallPhoneNumberStepEditorProps) => {
  const t = useTranslations()

  return (
    <BaseStepEditor icon={PhoneIcon} title={t("flows.actions.callPhoneNumber")}>
      <InputField
        label={t("fields.phoneNumber.label")}
        name={`${parentName}.phoneNumber`}
        type="tel"
      />
    </BaseStepEditor>
  )
}

export default CallPhoneNumberStepEditor
