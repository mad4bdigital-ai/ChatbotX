import {
  addDays,
  getDay,
  getHours,
  getMinutes,
  set,
  startOfDay,
} from "date-fns"

export type SendTimeWindow = {
  anytime: boolean
  sendDays: string | null
  sendTimeEnd: string | null
  sendTimeStart: string | null
}

const ALL_DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const VALID_DAY_NAMES = new Set<string>(ALL_DAYS)

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const

const MAX_ATTEMPTS = 14
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/

export function calculateNextValidSendTime(
  baseTime: Date,
  window: SendTimeWindow,
): Date {
  if (window.anytime) {
    return baseTime
  }

  const hasStart = window.sendTimeStart !== null
  const hasEnd = window.sendTimeEnd !== null
  if (hasStart !== hasEnd) {
    throw new Error(
      "Invalid sequence send window: start and end times must be configured together",
    )
  }

  let result = new Date(baseTime)
  const allowedDays = new Set(parseSendDays(window.sendDays))

  let startTimeInMin: number | null = null
  let endTimeInMin: number | null = null
  if (window.sendTimeStart && window.sendTimeEnd) {
    startTimeInMin = parseTimeToMinutes(window.sendTimeStart)
    endTimeInMin = parseTimeToMinutes(window.sendTimeEnd)

    if (startTimeInMin >= endTimeInMin) {
      throw new Error(
        "Invalid sequence send window: start time must be before end time",
      )
    }
  }

  let attempts = 0

  while (attempts < MAX_ATTEMPTS) {
    const dayName = getDayName(result)

    if (!allowedDays.has(dayName)) {
      result = startOfDay(addDays(result, 1))
      attempts++
      continue
    }

    if (startTimeInMin !== null && endTimeInMin !== null) {
      const currentHour = getHours(result)
      const currentMin = getMinutes(result)
      const currentTimeInMin = currentHour * 60 + currentMin

      if (currentTimeInMin < startTimeInMin) {
        const [startHour, startMin] = minutesToHourAndMinute(startTimeInMin)
        result = set(result, {
          hours: startHour,
          minutes: startMin,
          seconds: 0,
          milliseconds: 0,
        })
        return result
      }

      if (currentTimeInMin >= endTimeInMin) {
        result = startOfDay(addDays(result, 1))
        attempts++
        continue
      }

      return result
    }

    return result
  }

  throw new Error(
    "No valid sequence send time found within the scheduling horizon",
  )
}

function parseSendDays(sendDays: string | null): string[] {
  if (!sendDays) {
    return [...ALL_DAYS]
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(sendDays)
  } catch {
    throw new Error("Invalid sequence send window: sendDays is not valid JSON")
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length === 0 ||
    !parsed.every(
      (day): day is string =>
        typeof day === "string" && VALID_DAY_NAMES.has(day),
    )
  ) {
    throw new Error(
      "Invalid sequence send window: sendDays must contain valid weekdays",
    )
  }

  return [...new Set(parsed)]
}

function parseTimeToMinutes(time: string): number {
  if (!TIME_PATTERN.test(time)) {
    throw new Error(
      "Invalid sequence send window: time must use 24-hour HH:MM format",
    )
  }

  const [hour, minute] = time.split(":").map(Number)
  return hour * 60 + minute
}

function minutesToHourAndMinute(totalMinutes: number): [number, number] {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return [hour, minute]
}

function getDayName(date: Date): string {
  return DAY_NAMES[getDay(date)]
}
