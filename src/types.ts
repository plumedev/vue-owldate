import { Temporal } from '@js-temporal/polyfill'

/**
 * Supported date types for the picker.
 */
export type DateValue = Date | Temporal.PlainDate | Temporal.ZonedDateTime

/**
 * Represents a date range with a start and end date value.
 */
export interface DateRange {
  start: DateValue
  end: DateValue
}

/**
 * A preset shortcut for quickly selecting a range.
 */
export interface DateRangePreset {
  label: string
  getRange: () => [number, number]
}

/**
 * Props for the DateRangePicker component.
 */
export interface DateRangePickerProps {
  /** The selected date range (used with v-model). */
  modelValue: DateRange
  /** The locale used for date formatting (default: 'fr-FR'). */
  locale?: string
}
