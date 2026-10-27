"use client"

import { PhoneIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { BaseStepViewer } from "../base/viewer"

const CallPhoneNumberStepViewer = () => {
  const t = useTranslations()

  return (
    <BaseStepViewer
      icon={PhoneIcon}
      title={t("flows.actions.callPhoneNumber")}
    />
  )
}

export default CallPhoneNumberStepViewer
