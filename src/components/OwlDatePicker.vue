<template>
  <div class="drp" :class="{ 'drp--dark': config.darkMode }" :style="themeStyles">

    <!-- ── En-tête : plage affichée + raccourcis ── -->
    <div class="drp__header">
      <span class="drp__range-label">{{ formattedRangeString }}</span>

      <div class="drp__presets">
        <button
          v-for="preset in presets"
          :key="preset.label"
          class="drp__preset-btn"
          :class="{ 'drp__preset-btn--active': activePreset === preset.label }"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- ── Zone du slider ── -->
    <div class="drp__slider-wrapper">

      <!-- Info-bulle flottante « N Jours » -->
      <div
        v-if="durationInDays > 0"
        class="drp__tooltip"
        :style="{ left: `${centerOfRangePercentage}%` }"
      >
        {{ durationInDays }} Jours
        <span class="drp__tooltip-caret" />
      </div>

      <!-- Piste (Track) -->
      <div class="drp__track" ref="sliderTrackRef" @pointerdown="onPointerDownTrack">

        <div class="drp__track-inner">
          <!-- Zone active (plage bleue) -->
          <div
            class="drp__range"
            :class="{ 'drp__range--dragging': dragState.type === 'range' }"
            :style="{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }"
            @pointerdown="onPointerDownRange"
          />
        </div>

        <!-- Bordure décorative par-dessus la piste -->
        <div class="drp__track-border" />

        <!-- Poignée gauche -->
        <div
          class="drp__thumb drp__thumb--left"
          :style="{ left: `${startPercent}%` }"
          role="slider"
          tabindex="0"
          aria-label="Date de début"
          @pointerdown="onPointerDownLeft"
        >
          <slot name="thumb" v-bind="{ side: 'left', value: selected.start }">
            <slot name="thumb-left" v-bind="{ value: selected.start }">
              <div class="drp__thumb-handle" />
            </slot>
          </slot>
        </div>

        <!-- Poignée droite -->
        <div
          class="drp__thumb drp__thumb--right"
          :style="{ left: `${endPercent}%` }"
          role="slider"
          tabindex="0"
          aria-label="Date de fin"
          @pointerdown="onPointerDownRight"
        >
          <slot name="thumb" v-bind="{ side: 'right', value: selected.end }">
            <slot name="thumb-right" v-bind="{ value: selected.end }">
              <div class="drp__thumb-handle" />
            </slot>
          </slot>
        </div>
      </div>

      <!-- Étiquettes des mois -->
      <div class="drp__months">
        <span
          v-for="month in months"
          :key="month.ts"
          class="drp__month-label"
          :style="{ left: `${getPercentageForTimestamp(month.ts)}%` }"
        >
          {{ month.label }}
        </span>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'OwlDatePicker' })
import { computed, ref, shallowRef, onBeforeUnmount, watch } from 'vue'
import type { DateRange, DateRangePreset } from '../types'
import { DateAdapter } from '../utils/date-adapter'
import config from '../config'

// ─── v-model ───────────────────────────────────────────────────────────────
const selected = defineModel<DateRange>({ required: true })

// ─── Constantes & bornes temporelles ───────────────────────────────────────
const DAY_MS = 1000 * 60 * 60 * 24
const currentYear = new Date().getFullYear()
const minTimestamp = new Date(currentYear, 0, 1).getTime()
const maxTimestamp = new Date(currentYear, 11, 31).getTime()

// ─── État local (tableau [startTs, endTs]) ──────────────────────────────────
// On utilise shallowRef car on remplace toujours le tableau entier
const localValue = shallowRef<[number, number]>([
  DateAdapter.toTimestamp(selected.value?.start) ?? minTimestamp,
  DateAdapter.toTimestamp(selected.value?.end) ?? maxTimestamp,
])

/**
 * Pousse les changements locaux vers le parent (v-model)
 */
const emitChange = () => {
  const [s, e] = localValue.value
  
  const currentS = DateAdapter.toTimestamp(selected.value?.start)
  const currentE = DateAdapter.toTimestamp(selected.value?.end)

  if (s !== currentS || e !== currentE) {
    selected.value = { 
      start: DateAdapter.fromTimestamp(s), 
      end: DateAdapter.fromTimestamp(e)
    }
  }
}

// Synchronisation entrante : si le parent change selected, on met à jour localValue
watch(selected, (v) => {
  if (!v) return
  const sTs = DateAdapter.toTimestamp(v.start) ?? minTimestamp
  const eTs = DateAdapter.toTimestamp(v.end) ?? maxTimestamp
  // On ne met à jour localValue QUE si les timestamps diffèrent réellement
  if (sTs !== localValue.value[0] || eTs !== localValue.value[1]) {
    localValue.value = [sTs, eTs]
  }
}, { deep: true })

// ─── Positions en % sur la piste ───────────────────────────────────────────
const startPercent = computed(() => getPercentageForTimestamp(localValue.value[0]))
const endPercent   = computed(() => getPercentageForTimestamp(localValue.value[1]))

const durationInDays = computed(() =>
  Math.max(1, Math.round((localValue.value[1] - localValue.value[0]) / DAY_MS))
)

const centerOfRangePercentage = computed(() =>
  getPercentageForTimestamp((localValue.value[0] + localValue.value[1]) / 2)
)

// ─── Raccourcis (Presets) ───────────────────────────────────────────────────
const activePreset = ref<string | null>(null)

const presets: DateRangePreset[] = [
  {
    label: 'Ce mois',
    getRange: () => {
      const today = new Date()
      return [
        new Date(today.getFullYear(), today.getMonth(), 1).getTime(),
        new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).getTime(),
      ]
    },
  },
  {
    label: '7J',
    getRange: () => {
      const now = Date.now()
      return config.futurePresets ? [now, now + 7 * DAY_MS] : [now - 7 * DAY_MS, now]
    },
  },
  {
    label: '30J',
    getRange: () => {
      const now = Date.now()
      return config.futurePresets ? [now, now + 30 * DAY_MS] : [now - 30 * DAY_MS, now]
    },
  },
  {
    label: '90J',
    getRange: () => {
      const now = Date.now()
      return config.futurePresets ? [now, now + 90 * DAY_MS] : [now - 90 * DAY_MS, now]
    },
  },
]

const applyPreset = (preset: DateRangePreset) => {
  activePreset.value = preset.label
  const [start, end] = preset.getRange()
  localValue.value = [
    Math.max(minTimestamp, start),
    Math.min(maxTimestamp, end),
  ]
  emitChange()
}

// Réinitialise le preset actif si l'utilisateur déplace manuellement les poignées
watch(localValue, (newVal) => {
  if (!activePreset.value) return
  const preset = presets.find(p => p.label === activePreset.value)
  if (!preset) return
  const [s, e] = preset.getRange()
  const tolerance = DAY_MS * 2
  if (
    Math.abs(newVal[0] - Math.max(minTimestamp, s)) > tolerance ||
    Math.abs(newVal[1] - Math.min(maxTimestamp, e)) > tolerance
  ) {
    activePreset.value = null
  }
})

// ─── Formatage ──────────────────────────────────────────────────────────────
const formattedRangeString = computed(() => {
  const start = DateAdapter.fromTimestamp(localValue.value[0])
  const end = DateAdapter.fromTimestamp(localValue.value[1])
  if (!start || !end) return ''
  return DateAdapter.formatRange(start, end)
})

const getPercentageForTimestamp = (ts: number): number =>
  ((ts - minTimestamp) / (maxTimestamp - minTimestamp)) * 100

const months = computed(() => DateAdapter.getYearMonths(currentYear))

// ─── Drag & Drop (aucune dépendance externe) ────────────────────────────────
const sliderTrackRef = ref<HTMLElement | null>(null)

const dragState = ref<{
  type: 'left' | 'right' | 'range' | null
  startX: number
  initialValue: [number, number]
}>({ type: null, startX: 0, initialValue: [0, 0] })

const snapToDay = (ts: number): number =>
  minTimestamp + Math.round((ts - minTimestamp) / DAY_MS) * DAY_MS

const startDrag = (type: 'left' | 'right' | 'range', event: PointerEvent) => {
  if (event.button !== 0) return
  event.preventDefault()
  event.stopPropagation()
  dragState.value = { type, startX: event.clientX, initialValue: [...localValue.value] }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

const onPointerDownLeft  = (e: PointerEvent) => startDrag('left', e)
const onPointerDownRight = (e: PointerEvent) => startDrag('right', e)
const onPointerDownRange = (e: PointerEvent) => startDrag('range', e)

/** Clic direct sur la piste : aspire la poignée la plus proche */
const onPointerDownTrack = (e: PointerEvent) => {
  if (e.button !== 0 || !sliderTrackRef.value) return
  e.preventDefault()

  const rect = sliderTrackRef.value.getBoundingClientRect()
  const clickPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
  const clickTs = snapToDay(minTimestamp + (clickPercent / 100) * (maxTimestamp - minTimestamp))

  const distLeft  = Math.abs(clickTs - localValue.value[0])
  const distRight = Math.abs(clickTs - localValue.value[1])

  if (distLeft <= distRight) {
    localValue.value = [Math.min(clickTs, localValue.value[1] - DAY_MS), localValue.value[1]]
    emitChange()
    startDrag('left', e)
  } else {
    localValue.value = [localValue.value[0], Math.max(clickTs, localValue.value[0] + DAY_MS)]
    emitChange()
    startDrag('right', e)
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragState.value.type || !sliderTrackRef.value) return

  const rect        = sliderTrackRef.value.getBoundingClientRect()
  const shiftTs     = ((event.clientX - dragState.value.startX) / rect.width) * (maxTimestamp - minTimestamp)

  let [newStart, newEnd] = dragState.value.initialValue

  if (dragState.value.type === 'left') {
    newStart = Math.max(minTimestamp, Math.min(newEnd - DAY_MS, snapToDay(newStart + shiftTs)))
  } else if (dragState.value.type === 'right') {
    newEnd = Math.min(maxTimestamp, Math.max(newStart + DAY_MS, snapToDay(newEnd + shiftTs)))
  } else {
    // Déplacement du bloc entier
    const shiftDays = Math.round(shiftTs / DAY_MS)
    const duration  = newEnd - newStart
    let targetStart = newStart + shiftDays * DAY_MS
    let targetEnd   = newEnd   + shiftDays * DAY_MS

    if (targetStart < minTimestamp) { targetStart = minTimestamp; targetEnd = targetStart + duration }
    else if (targetEnd > maxTimestamp) { targetEnd = maxTimestamp; targetStart = targetEnd - duration }

    newStart = targetStart
    newEnd   = targetEnd
  }

  if (newStart !== localValue.value[0] || newEnd !== localValue.value[1]) {
    localValue.value = [newStart, newEnd]
    emitChange()
  }
}

const onPointerUp = () => {
  dragState.value.type = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

const themeStyles = computed(() => {
  const t = config.theme
  const isDark = config.darkMode
  
  const defaults = isDark ? {
    primary: '#818cf8',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    border: '#334155',
    radius: '16px',
    tooltipBg: '#f8fafc',
    tooltipText: '#020617',
  } : {
    primary: '#6366f1',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#1f2937',
    textMuted: '#9ca3af',
    border: '#e5e7eb',
    radius: '16px',
    tooltipBg: '#111827',
    tooltipText: '#ffffff',
  }

  return {
    '--drp-primary': t.primary || defaults.primary,
    '--drp-bg': t.background || defaults.background,
    '--drp-surface': t.surface || defaults.surface,
    '--drp-text': t.text || defaults.text,
    '--drp-text-muted': t.textMuted || defaults.textMuted,
    '--drp-border': t.border || defaults.border,
    '--drp-radius': t.radius || defaults.radius,
    '--drp-tooltip-bg': t.tooltipBg || defaults.tooltipBg,
    '--drp-tooltip-text': t.tooltipText || defaults.tooltipText,
  }
})

// Nettoyage en cas de démontage pour éviter les fuites mémoire
onBeforeUnmount(onPointerUp)
</script>

<style lang="scss">
@use "./OwlDatePicker.scss";
</style>
