<template>
  <div style="min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; font-family: sans-serif;">
    <h1 style="margin-bottom: 8px; font-size: 20px; color: #111;">Vue DatePicker — Démo</h1>
    <p style="margin-bottom: 32px; color: #666; font-size: 14px;">
      Plage sélectionnée&nbsp;:
      <strong>{{ range.start.toLocaleDateString('fr-FR') }} → {{ range.end.toLocaleDateString('fr-FR') }}</strong>
    </p>
    <DateRangePicker v-model="range" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DateRangePicker from '../components/DateRangePicker.vue'
import type { DateRange } from '../types'

const range = ref<DateRange>({
  start: new Date(new Date().getFullYear(), 0, 1),
  end: new Date(),
})
</script>
