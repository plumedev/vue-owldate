import { createApp } from 'vue'
import Demo from './Demo.vue'
import { VueOwldate } from '../index'

const app = createApp(Demo)

app.use(VueOwldate, {
  useTemporal: true,
  temporalType: 'ZonedDateTime',
})

app.mount('#app')
