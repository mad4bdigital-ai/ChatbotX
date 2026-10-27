import { resolveCallLinkNumber } from "@chatbotx.io/business/open-link"
import { buttonVariants } from "@chatbotx.io/ui/components/ui/button"
import { cn } from "@chatbotx.io/ui/lib/utils"
import type { Metadata } from "next"
import type { SearchParams } from "next/dist/server/request/search-params"
import { getTranslations } from "next-intl/server"
import { PublicMessage } from "@/components/public-message"
import { OpenLinkRedirect } from "@/features/open-link/components/open-link-redirect"

export const dynamic = "force-dynamic"

type CallPageProps = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations()
  // Never indexed: one URL per number, only ever tapped from a conversation.
  return {
    title: t("flows.actions.callPhoneNumber"),
    robots: { index: false, follow: false },
  }
}

/**
 * Where a `callPhoneNumber` button lands on channels without a native dial
 * button (Instagram, whose buttons are web_url/postback only).
 *
 * Tries to open the dialer straight away and keeps a tappable `tel:` link on
 * screen for in-app browsers that only honour a user gesture. The number is
 * validated to `+<digits>` before it is ever put into an href.
 */
export default async function CallPage(props: CallPageProps) {
  const searchParams = await props.searchParams
  const raw = searchParams.n
  const phoneNumber = resolveCallLinkNumber(Array.isArray(raw) ? raw[0] : raw)

  if (!phoneNumber) {
    const t = await getTranslations("openLink")
    return (
      <PublicMessage
        description={t("invalidDescription")}
        title={t("invalidTitle")}
      />
    )
  }

  const t = await getTranslations()
  const href = `tel:${phoneNumber}`

  return (
    <>
      <OpenLinkRedirect destination={href} />
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="font-semibold text-2xl tabular-nums">{phoneNumber}</p>
        <a
          className={cn(buttonVariants({ size: "lg" }), "w-full max-w-xs")}
          href={href}
        >
          {t("flows.actions.callPhoneNumber")}
        </a>
      </div>
    </>
  )
}
