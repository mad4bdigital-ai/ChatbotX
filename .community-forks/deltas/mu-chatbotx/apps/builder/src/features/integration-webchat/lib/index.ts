import {
  BRANDING_TITLE,
  buildBrandingUrl,
  ensureBrandingMenuEntry,
  moveBrandingMenuLast,
  stripBrandingMenuEntry,
} from "@chatbotx.io/business/branding"
import type {
  ChannelType,
  WebchatPersistentMenu,
} from "@chatbotx.io/database/partials"
import { isBrandingHidden, isCommunity } from "@/env"

export { BRANDING_TITLE } from "@chatbotx.io/business/branding"
export { isBrandingHidden } from "@/env"

export function getBrandingUrl(channel: ChannelType, appUrl: string) {
  return buildBrandingUrl(appUrl, channel, isCommunity())
}

/** Community keeps the branding entry mandatory unless the deployment hides it. */
export const isBrandingEnforced = () => isCommunity() && !isBrandingHidden()

/** Initial persistent menu for a freshly connected channel. */
export function initialBrandingMenus<T>(entry: T): T[] {
  return isBrandingHidden() ? [] : [entry]
}

/**
 * Prepare a channel's persistent menu for sending: branding last when shown,
 * removed entirely when the deployment hides branding.
 */
export function prepareBrandedMenus<T extends { type: string; url?: string }>(
  menus: readonly T[],
  brandingUrl: string,
): T[] {
  return isBrandingHidden()
    ? stripBrandingMenuEntry(menus, brandingUrl)
    : moveBrandingMenuLast(menus, brandingUrl)
}

/**
 * Community deployments keep the "Built with" branding entry on every
 * webchat persistent menu; re-adds it when missing. Shared by the create and
 * update paths (actions and public API) so they cannot drift.
 */
export function applyWebchatBranding(
  persistentMenus: WebchatPersistentMenu[],
  appUrl: string,
): WebchatPersistentMenu[]
export function applyWebchatBranding(
  persistentMenus: WebchatPersistentMenu[] | undefined,
  appUrl: string,
): WebchatPersistentMenu[] | undefined
export function applyWebchatBranding(
  persistentMenus: WebchatPersistentMenu[] | undefined,
  appUrl: string,
): WebchatPersistentMenu[] | undefined {
  if (isBrandingHidden() && persistentMenus) {
    return stripBrandingMenuEntry(
      persistentMenus,
      getBrandingUrl("webchat", appUrl),
    )
  }
  return isCommunity() && persistentMenus
    ? (ensureBrandingMenuEntry(persistentMenus, {
        label: BRANDING_TITLE,
        url: getBrandingUrl("webchat", appUrl),
      }) as WebchatPersistentMenu[])
    : persistentMenus
}
