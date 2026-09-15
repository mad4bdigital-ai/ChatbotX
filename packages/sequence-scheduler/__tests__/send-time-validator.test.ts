import { describe, expect, test } from "vitest"

// Pure function — no mocks required

// January 1 2024 is a Monday (getDay() === 1).
// All Date constructors below use local-time form (year, month, day, h, m, s, ms)
// so that date-fns getHours / getMinutes / getDay operate on predictable local values.

describe("calculateNextValidSendTime", () => {
  test("returns baseTime unchanged when anytime is true", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: true,
      sendDays: '["monday"]',
      sendTimeStart: "09:00",
      sendTimeEnd: "17:00",
    })

    expect(result).toBe(baseTime)
  })

  test("rolls to startOfDay next allowed day when current day is not in sendDays", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["tuesday"]',
      sendTimeStart: null,
      sendTimeEnd: null,
    })

    const expected = new Date(2024, 0, 2, 0, 0, 0, 0)
    expect(result).toEqual(expected)
  })

  test("snaps to window start time when current time is before the send window", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 7, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["monday"]',
      sendTimeStart: "09:00",
      sendTimeEnd: "17:00",
    })

    const expected = new Date(2024, 0, 1, 9, 0, 0, 0)
    expect(result).toEqual(expected)
  })

  test("snaps to window start on next allowed day when time equals window end", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 17, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["monday","tuesday"]',
      sendTimeStart: "09:00",
      sendTimeEnd: "17:00",
    })

    const expected = new Date(2024, 0, 2, 9, 0, 0, 0)
    expect(result).toEqual(expected)
  })

  test("snaps to window start on next allowed day when time is after window end", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 20, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["monday","tuesday"]',
      sendTimeStart: "09:00",
      sendTimeEnd: "17:00",
    })

    const expected = new Date(2024, 0, 2, 9, 0, 0, 0)
    expect(result).toEqual(expected)
  })

  test("returns unchanged time when time is inside the send window", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 12, 30, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["monday"]',
      sendTimeStart: "09:00",
      sendTimeEnd: "17:00",
    })

    expect(result).toEqual(baseTime)
  })

  test("returns unchanged time when no time window is set and day is allowed", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 5, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["monday"]',
      sendTimeStart: null,
      sendTimeEnd: null,
    })

    expect(result).toEqual(baseTime)
  })

  test("fails closed when sendDays is invalid JSON", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: "not-valid-json",
        sendTimeStart: null,
        sendTimeEnd: null,
      }),
    ).toThrow("sendDays is not valid JSON")
  })

  test("allows all days when sendDays is null", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 6, 14, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: null,
      sendTimeStart: null,
      sendTimeEnd: null,
    })

    expect(result).toEqual(baseTime)
  })

  test("fails closed when sendDays is an empty array", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: "[]",
        sendTimeStart: null,
        sendTimeEnd: null,
      }),
    ).toThrow("sendDays must contain valid weekdays")
  })

  test("fails closed when sendDays contains an unknown weekday", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: '["monday","funday"]',
        sendTimeStart: null,
        sendTimeEnd: null,
      }),
    ).toThrow("sendDays must contain valid weekdays")
  })

  test("fails closed when only one time boundary is configured", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: '["monday"]',
        sendTimeStart: "09:00",
        sendTimeEnd: null,
      }),
    ).toThrow("start and end times must be configured together")
  })

  test("fails closed when a time is not valid 24-hour HH:MM", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: '["monday"]',
        sendTimeStart: "25:70",
        sendTimeEnd: "26:00",
      }),
    ).toThrow("time must use 24-hour HH:MM format")
  })

  test("fails closed when start time is not before end time", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    expect(() =>
      calculateNextValidSendTime(baseTime, {
        anytime: false,
        sendDays: '["monday"]',
        sendTimeStart: "17:00",
        sendTimeEnd: "09:00",
      }),
    ).toThrow("start time must be before end time")
  })

  test("skips multiple non-allowed days before landing on an allowed one", async () => {
    const { calculateNextValidSendTime } = await import(
      "../src/send-time-validator"
    )
    const baseTime = new Date(2024, 0, 1, 10, 0, 0, 0)

    const result = calculateNextValidSendTime(baseTime, {
      anytime: false,
      sendDays: '["friday"]',
      sendTimeStart: null,
      sendTimeEnd: null,
    })

    const expected = new Date(2024, 0, 5, 0, 0, 0, 0)
    expect(result).toEqual(expected)
  })
})
