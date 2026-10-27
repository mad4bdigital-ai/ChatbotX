/**
 * Omit JSON object properties containing unresolved {{variable}} expressions.
 *
 * An empty string after successful interpolation is intentional and must be
 * retained (unlike the older community-fork implementation). Numeric zero,
 * false and null are also retained. Array positions are never removed.
 * Invalid JSON is returned verbatim for the existing request validation layer.
 */
const UNRESOLVED_PLACEHOLDER = /\{\{[^{}]+\}\}/

export function stripUnresolvedJsonValues(jsonBody: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonBody)
  } catch {
    return jsonBody
  }

  const clean = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(clean)
    }
    if (input !== null && typeof input === "object") {
      const values: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(input)) {
        if (typeof value === "string" && UNRESOLVED_PLACEHOLDER.test(value)) {
          continue
        }
        values[key] = clean(value)
      }
      return values
    }
    return input
  }
  return JSON.stringify(clean(parsed))
}
