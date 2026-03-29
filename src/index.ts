import type { App } from 'vue'
import OwlDatePicker from './components/OwlDatePicker.vue'
import config, { type OwldateConfig } from './config'

// ── Export nommé du composant ───────────────────────────────────────────────
// import { OwlDatePicker } from 'vue-owldate'
export { OwlDatePicker }

// ── Plugin Vue (export nommé) ───────────────────────────────────────────────
export const VueOwldate = {
  install(app: App, options?: Partial<OwldateConfig>) {
    if (options) {
      Object.assign(config, options)
    }
    app.component('OwlDatePicker', OwlDatePicker)
  },
}

// ── Types publics ───────────────────────────────────────────────────────────
export type { DateRange, DateRangePreset, OwlDatePickerProps } from './types'

export default VueOwldate
