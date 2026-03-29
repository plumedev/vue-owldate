<template>
  <div style="min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; font-family: sans-serif;">
    <h1 style="margin-bottom: 8px; font-size: 20px; color: #111;">Vue DatePicker — Démo</h1>
    <p style="margin-bottom: 16px; color: #666; font-size: 14px;">
      Mode actuel : <strong>{{ config.useTemporal ? 'Temporal API (' + config.temporalType + ')' : 'Native Date' }}</strong>
      <button @click="toggleApi" style="margin-left: 10px; cursor: pointer;">Changer d'API</button>
    </p>
    <p style="margin-bottom: 32px; color: #666; font-size: 14px;">
      Plage sélectionnée&nbsp;:
      <strong>{{ format(range.start) }} → {{ format(range.end) }}</strong>
    </p>
    <OwlDatePicker v-model="range" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OwlDatePicker from '../components/OwlDatePicker.vue'
import type { DateRange, DateValue } from '../types'
import config from '../config'
import { DateAdapter } from '../utils/date-adapter'

const range = ref<DateRange>({
  start: DateAdapter.fromTimestamp(new Date(new Date().getFullYear(), 0, 1).getTime()),
  end: DateAdapter.fromTimestamp(Date.now()),
})

const format = (val: DateValue | null) => {
  if (!val) return '—'
  if (val instanceof Date) return val.toLocaleDateString('fr-FR')
  return val.toLocaleString('fr-FR')
}

const toggleApi = () => {
  // On change le mode dans la config
  config.useTemporal = !config.useTemporal
  
  // On convertit les valeurs actuelles pour le v-model
  range.value = {
    start: DateAdapter.fromTimestamp(DateAdapter.toTimestamp(range.value.start)),
    end: DateAdapter.fromTimestamp(DateAdapter.toTimestamp(range.value.end)),
  }
}
</script>
