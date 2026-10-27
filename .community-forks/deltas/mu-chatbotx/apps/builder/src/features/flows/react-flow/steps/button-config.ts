import { channelTypes } from "@chatbotx.io/database/partials"
import { type ButtonType, buttonTypes } from "@chatbotx.io/flow-config"
import {
  LinkIcon,
  type LucideIcon,
  MessageCircleIcon,
  PhoneIcon,
  SkipForwardIcon,
  SquareArrowOutUpRightIcon,
  ZapIcon,
} from "lucide-react"
import type { TranslationFn } from "../nodes/types"

/**
 * Messenger dials natively and Instagram (no dial button) opens the `/call`
 * page; neither allows it as a quick reply. Nodes default to `omnichannel`
 * (they run on whatever channel the contact is on), so the option is offered
 * there too; a node pinned to any other channel hides it, and a send on such a
 * channel degrades the button to a postback.
 */
export const canOfferCallPhoneNumberButton = ({
  channel,
  isQuickReply,
}: {
  channel: string | undefined
  isQuickReply: boolean
}): boolean =>
  !isQuickReply &&
  (channel === undefined ||
    channel === channelTypes.enum.omnichannel ||
    channel === channelTypes.enum.messenger ||
    channel === channelTypes.enum.instagram)

type IButtonConfig = {
  icon: LucideIcon
  label: string
  buttonType: ButtonType
}

export const allButtonsConfig = (t: TranslationFn): IButtonConfig[] => [
  {
    buttonType: buttonTypes.enum.sendMessage,
    icon: MessageCircleIcon,
    label: t("flows.actions.sendMessage"),
  },
  {
    buttonType: buttonTypes.enum.openWebsite,
    icon: LinkIcon,
    label: t("flows.actions.openWebsite"),
  },
  {
    buttonType: buttonTypes.enum.callPhoneNumber,
    icon: PhoneIcon,
    label: t("flows.actions.callPhoneNumber"),
  },
  {
    buttonType: buttonTypes.enum.performAction,
    icon: ZapIcon,
    label: t("flows.actions.performAction"),
  },
  {
    buttonType: buttonTypes.enum.startExternalFlow,
    icon: SquareArrowOutUpRightIcon,
    label: t("flows.actions.startExternalFlow"),
  },
  {
    buttonType: buttonTypes.enum.startExternalNode,
    icon: SkipForwardIcon,
    label: t("flows.actions.startExternalNode"),
  },
  {
    buttonType: buttonTypes.enum.startAnotherNode,
    icon: SquareArrowOutUpRightIcon,
    label: t("flows.actions.startAnotherNode"),
  },
]
