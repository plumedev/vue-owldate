import { Temporal } from '@js-temporal/polyfill'
import config from '../config'

import type { DateValue } from '../types'

/**
 * Adapter to handle both native `Date` and the new `Temporal` API.
 */
export class DateAdapter {
  /**
   * Converts a date value into a numeric timestamp (ms).
   */
  static toTimestamp(val: DateValue | undefined | null): number | null {
    if (!val) return null
    
    let ts: number
    if (val instanceof Date) {
       ts = val.getTime()
    } else if (val instanceof Temporal.PlainDate) {
       ts = val.toZonedDateTime('UTC').epochMilliseconds
    } else if (val instanceof Temporal.ZonedDateTime) {
       ts = val.epochMilliseconds
    } else {
       return null
    }

    return isNaN(ts) ? null : ts
  }

  /**
   * Converts a numeric timestamp (ms) back to the configured DateValue type.
   */
  static fromTimestamp(ts: number | null): DateValue | null {
    if (ts === null || isNaN(ts)) return null

    if (!config.useTemporal) {
      return new Date(ts)
    }

    const instant = Temporal.Instant.fromEpochMilliseconds(ts)
    if (config.temporalType === 'ZonedDateTime') {
      return instant.toZonedDateTimeISO(Temporal.Now.timeZoneId())
    }
    return instant.toZonedDateTimeISO('UTC').toPlainDate()
  }

  /**
   * Adds a duration (in days) to a date value.
   */
  static addDays(val: DateValue, days: number): DateValue {
    if (val instanceof Date) {
      const d = new Date(val.getTime())
      d.setDate(d.getDate() + days)
      return d
    }
    if (val instanceof Temporal.PlainDate || val instanceof Temporal.ZonedDateTime) {
      return val.add({ days })
    }
    return val
  }

  /**
   * Formats a range for display.
   */
  static formatRange(start: DateValue, end: DateValue, locale: string = 'fr-FR'): string {
     const startTs = this.toTimestamp(start)
     const endTs = this.toTimestamp(end)
     const startDate = new Date(startTs ?? 0)
     const endDate = new Date(endTs ?? 0)
     const today = new Date()
     
     const df = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' })
     const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
     
     const endStr = endDate.toDateString() === today.toDateString()
       ? "Aujourd'hui"
       : capitalize(df.format(endDate))
     
     return `${capitalize(df.format(startDate))} – ${endStr}`
  }

  /**
   * Gets a list of months for a specific year.
   */
  static getYearMonths(year: number, locale: string = 'fr-FR'): { label: string, ts: number }[] {
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(year, i, 15)
      return {
        label: new Intl.DateTimeFormat(locale, { month: 'short' }).format(d).replace('.', ''),
        ts: d.getTime(),
      }
    })
  }
}
