import type { App } from 'vue'
import DateRangePicker from './components/DateRangePicker.vue'

// ── Export nommé du composant ───────────────────────────────────────────────
// import { DateRangePicker } from 'vue-owldate'
export { DateRangePicker }

// ── Plugin Vue (export nommé) ───────────────────────────────────────────────
// import { VueOwldate } from 'vue-owldate'
// app.use(VueOwldate) → enregistre <DateRangePicker> globalement
export const VueOwldate = {
  install(app: App) {
    app.component('DateRangePicker', DateRangePicker)
  },
}

// ── Types publics ───────────────────────────────────────────────────────────
export type { DateRange, DateRangePreset, DateRangePickerProps } from './types'
