import type { App } from 'vue'
import DateRangePicker from './components/DateRangePicker.vue'
import config, { type OwldateConfig } from './config'

// ── Export nommé du composant ───────────────────────────────────────────────
// import { DateRangePicker } from 'vue-owldate'
export { DateRangePicker }

// ── Plugin Vue (export nommé) ───────────────────────────────────────────────
export const VueOwldate = {
  install(app: App, options?: Partial<OwldateConfig>) {
    if (options) {
      Object.assign(config, options)
    }
    app.component('DateRangePicker', DateRangePicker)
  },
}

// ── Types publics ───────────────────────────────────────────────────────────
export type { DateRange, DateRangePreset, DateRangePickerProps } from './types'
