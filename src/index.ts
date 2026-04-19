import type { App } from 'vue'
import OwlDatePicker from './components/OwlDatePicker.vue'
import config, { type OwldateConfig } from './config'

// Vue Plugin (default and named export) 
export const VueOwldate = {
  install(app: App, options?: Partial<OwldateConfig>) {
    if (options) {
      Object.assign(config, options)
    }
    app.component('OwlDatePicker', OwlDatePicker)
  },
}

// Named export of the component 
export { default as OwlDatePicker } from './components/OwlDatePicker.vue'

// Public types 
export type { DateRange, DateRangePreset, OwlDatePickerProps } from './types'
export type { OwldateConfig } from './config'

export default VueOwldate
