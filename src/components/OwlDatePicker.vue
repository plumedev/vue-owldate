<template>
  <div class="drp">

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

        <!-- Zone active (plage bleue) -->
        <div
          class="drp__range"
          :class="{ 'drp__range--dragging': dragState.type === 'range' }"
          :style="{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }"
          @pointerdown="onPointerDownRange"
        />

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
        />

        <!-- Poignée droite -->
        <div
          class="drp__thumb drp__thumb--right"
          :style="{ left: `${endPercent}%` }"
          role="slider"
          tabindex="0"
          aria-label="Date de fin"
          @pointerdown="onPointerDownRight"
        />
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
  selected.value?.start ? DateAdapter.toTimestamp(selected.value.start) : minTimestamp,
  selected.value?.end ? DateAdapter.toTimestamp(selected.value.end) : maxTimestamp,
])

/**
 * Pousse les changements locaux vers le parent (v-model)
 */
const emitChange = () => {
  const [s, e] = localValue.value
  selected.value = { 
    start: DateAdapter.fromTimestamp(s), 
    end: DateAdapter.fromTimestamp(e) 
  }
}

// Synchronisation entrante : si le parent change selected, on met à jour localValue
watch(selected, (v) => {
  if (!v) return
  const sTs = DateAdapter.toTimestamp(v.start)
  const eTs = DateAdapter.toTimestamp(v.end)
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
      const end = Date.now()
      return [end - 7 * DAY_MS, end]
    },
  },
  {
    label: '30J',
    getRange: () => {
      const end = Date.now()
      return [end - 30 * DAY_MS, end]
    },
  },
  {
    label: '90J',
    getRange: () => {
      const end = Date.now()
      return [end - 90 * DAY_MS, end]
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
  return DateAdapter.formatRange(start,end)
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

// Nettoyage en cas de démontage pour éviter les fuites mémoire
onBeforeUnmount(onPointerUp)
</script>

<style lang="scss">
// ─── Variables CSS du composant ─────────────────────────────────────────────
// Surchargeables par l'utilisateur depuis l'extérieur via :root { --drp-primary: ... }
:root {
  --drp-primary:        #6366f1;      // indigo-500
  --drp-primary-light:  rgba(99, 102, 241, 0.12);
  --drp-primary-border: rgba(99, 102, 241, 0.40);
  --drp-bg:             #ffffff;
  --drp-surface:        #f9fafb;
  --drp-border:         #e5e7eb;
  --drp-text:           #1f2937;
  --drp-text-muted:     #9ca3af;
  --drp-radius:         16px;
  --drp-font:           system-ui, -apple-system, 'Segoe UI', sans-serif;
}

// ─── Racine du composant ─────────────────────────────────────────────────────
.drp {
  font-family:     var(--drp-font);
  background:      var(--drp-bg);
  border:          1px solid var(--drp-border);
  border-radius:   var(--drp-radius);
  box-shadow:      0 1px 3px rgba(0, 0, 0, 0.06);
  padding:         20px;
  width:           100%;
  min-width:       600px;
  box-sizing:      border-box;

  // ── En-tête ─────────────────────────────────────────────────────────────
  &__header {
    display:         flex;
    justify-content: space-between;
    align-items:     center;
    margin-bottom:   32px;
  }

  &__range-label {
    font-size:   14px;
    font-weight: 600;
    color:       var(--drp-text);
    letter-spacing: -0.01em;
  }

  // ── Boutons preset ───────────────────────────────────────────────────────
  &__presets {
    display:       flex;
    gap:           4px;
    background:    var(--drp-surface);
    padding:       4px;
    border-radius: 8px;
  }

  &__preset-btn {
    padding:       6px 12px;
    font-size:     12px;
    font-weight:   500;
    border:        none;
    background:    transparent;
    color:         var(--drp-text-muted);
    border-radius: 6px;
    cursor:        pointer;
    transition:    background 0.15s, color 0.15s, box-shadow 0.15s;
    font-family:   inherit;

    &:hover {
      background: rgba(156, 163, 175, 0.25);
      color:      var(--drp-text);
    }

    &--active {
      background:  var(--drp-bg);
      color:       var(--drp-text);
      box-shadow:  0 1px 3px rgba(0, 0, 0, 0.10);
      border:      1px solid rgba(229, 231, 235, 0.8);
    }
  }

  // ── Zone slider ─────────────────────────────────────────────────────────
  &__slider-wrapper {
    position: relative;
    width:    100%;
    padding:  8px 16px 24px;
  }

  // ── Info-bulle « N Jours » ───────────────────────────────────────────────
  &__tooltip {
    position:       absolute;
    top:            -8px;
    padding:        6px 12px;
    background:     #111827;
    color:          #fff;
    font-size:      12px;
    font-weight:    500;
    border-radius:  6px;
    white-space:    nowrap;
    pointer-events: none;
    transform:      translateX(-50%);
    z-index:        10;
    transition:     left 0.08s ease;
  }

  &__tooltip-caret {
    position:   absolute;
    bottom:     -4px;
    left:       50%;
    transform:  translateX(-50%) rotate(45deg);
    width:      8px;
    height:     8px;
    background: #111827;
  }

  // ── Piste principale ─────────────────────────────────────────────────────
  &__track {
    position:    relative;
    width:       100%;
    height:      40px;
    touch-action: none;
    user-select:  none;
    margin-top:   8px;
    cursor:       pointer;

    // Fond texturé en SVG inline (graduation)
    background-color: var(--drp-surface);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cline x1='20' y1='28' x2='20' y2='40' stroke='%23d1d5db' stroke-width='1'/%3E%3C/svg%3E");
    background-repeat: repeat-x;
    background-position: center;
    border-radius: 8px;
    overflow: hidden;
  }

  // ── Zone active (plage sélectionnée) ────────────────────────────────────
  &__range {
    position: absolute;
    height:   100%;
    background:   var(--drp-primary-light);
    border-top:   2px solid var(--drp-primary-border);
    border-bottom: 2px solid var(--drp-primary-border);
    backdrop-filter: saturate(1.2);
    cursor:  grab;
    transition: background 0.1s;

    &--dragging { cursor: grabbing; }
  }

  // ── Bordure décorative par-dessus la piste ───────────────────────────────
  &__track-border {
    position:       absolute;
    inset:          0;
    border:         1px solid var(--drp-border);
    border-radius:  8px;
    pointer-events: none;
  }

  // ── Poignées (thumbs) ────────────────────────────────────────────────────
  &__thumb {
    position: absolute;
    top:      50%;
    width:    0;
    height:   0;
    cursor:   ew-resize;
    z-index:  10;

    &:focus { outline: none; }

    // Le visuel de la poignée via ::after
    &::after {
      content:    '';
      position:   absolute;
      top:        50%;
      left:       50%;
      transform:  translate(-50%, -50%);
      width:      20px;
      height:     32px;
      // Poignée SVG inline (deux lignes verticales)
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='32' viewBox='0 0 20 32'%3E%3Crect x='0' y='0' width='20' height='32' rx='4' fill='white' stroke='%23d1d5db' stroke-width='1.5'/%3E%3Cline x1='7' y1='10' x2='7' y2='22' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3Cline x1='13' y1='10' x2='13' y2='22' stroke='%236b7280' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat:   no-repeat;
      background-position: center;
      background-size:     contain;
      filter:     drop-shadow(0 1px 3px rgba(0,0,0,0.15));
      transition: transform 0.15s ease-out;
    }

    &:hover::after,
    &:focus::after {
      transform: translate(-50%, -50%) scale(1.15);
    }
  }

  // ── Étiquettes des mois ──────────────────────────────────────────────────
  &__months {
    position:   relative;
    width:      100%;
    height:     16px;
    margin-top: 12px;
  }

  &__month-label {
    position:       absolute;
    font-size:      11px;
    color:          var(--drp-text-muted);
    font-weight:    500;
    text-transform: capitalize;
    pointer-events: none;
    transform:      translateX(-50%);
    white-space:    nowrap;
  }
}
</style>
