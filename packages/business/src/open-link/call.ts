import { PHONE_NUMBER_PATTERN } from "@chatbotx.io/flow-config"

/** `+<digits>` form every dialer understands; adds the `+` when missing. */
export const toDialablePhoneNumber = (phoneNumber: string): string => {
  const trimmed = phoneNumber.trim()
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`
}

/**
 * Public page a `callPhoneNumber` button opens on channels without a native
 * dial button (Instagram). Shape: `<appUrl>/call?n=<+digits>`.
 *
 * Unsigned on purpose: the page only ever renders a `tel:` link for a value
 * that passes {@link resolveCallLinkNumber}, so there is nothing to redirect
 * to and nothing to forge.
 */
export const buildCallLinkUrl = (props: {
  appUrl: string
  phoneNumber: string
}): string => {
  const target = new URL("/call", props.appUrl)
  target.searchParams.set("n", toDialablePhoneNumber(props.phoneNumber))
  return target.toString()
}

/**
 * The number the `/call` page may dial, or `null` when `n` is not a plain
 * international number — the only thing ever interpolated into its `tel:` link.
 */
export const resolveCallLinkNumber = (
  n: string | null | undefined,
): string | null => {
  if (!n) {
    return null
  }
  const dialable = toDialablePhoneNumber(n)
  return PHONE_NUMBER_PATTERN.test(dialable) ? dialable : null
}
