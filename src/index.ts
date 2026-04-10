import type { App } from 'vue'
import OwlDatePicker from './components/OwlDatePicker.vue'
import config, { type OwldateConfig } from './config'

// ── Plugin Vue (export par défaut et nommé) ──────────────────────────────────
export const VueOwldate = {
  install(app: App, options?: Partial<OwldateConfig>) {
    if (options) {
      Object.assign(config, options)
    }
    app.component('OwlDatePicker', OwlDatePicker)
  },
}

// ── Export nommé du composant ───────────────────────────────────────────────
export { default as OwlDatePicker } from './components/OwlDatePicker.vue'

// ── Types publics ───────────────────────────────────────────────────────────
export type { DateRange, DateRangePreset, OwlDatePickerProps } from './types'
export type { OwldateConfig } from './config'

export default VueOwldate
