<template>
  <div id="vue-owl-picker" :class="['vod', 'vod--' + config.headerPosition]" :style="themeStyles">

    <!-- Header: displayed range + shortcuts -->
    <div class="vod__header">
      <span class="vod__range-label">{{ formattedRangeString }}</span>

      <div class="vod__presets">
        <button
          v-for="preset in presets"
          :key="preset.label"
          class="vod__preset-btn"
          :class="{ 'vod__preset-btn--active': activePreset === preset.label }"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Slider area -->
    <div class="vod__slider-wrapper">

      <!-- Tooltip for the number of days -->
      <div
        v-if="durationInDays > 0"
        class="vod__tooltip"
        :style="{ left: `${centerOfRangePercentage}%` }"
      >
        {{ durationInDays }} Jours
        <span class="vod__tooltip-caret" />
      </div>

      <!-- Track -->
      <div class="vod__track" ref="sliderTrackRef" @pointerdown="onPointerDownTrack">

        <!-- Active range -->
        <div
          class="vod__range"
          :class="{ 'vod__range--dragging': dragState.type === 'range' }"
          :style="{ left: `${startPercent}%`, width: `${endPercent - startPercent}%` }"
          @pointerdown="onPointerDownRange"
        />

        <!-- Decorative border over the track -->
        <div class="vod__track-border" />

        <!-- Left handle -->
        <div
          class="vod__thumb vod__thumb--left"
          :style="{ left: `${startPercent}%` }"
          role="slider"
          tabindex="0"
          aria-label="Date de début"
          @pointerdown="onPointerDownLeft"
        />

        <!-- Right handle -->
        <div
          class="vod__thumb vod__thumb--right"
          :style="{ left: `${endPercent}%` }"
          role="slider"
          tabindex="0"
          aria-label="Date de fin"
          @pointerdown="onPointerDownRight"
        />
      </div>

      <!-- Month labels -->
      <div class="vod__months">
        <span
          v-for="month in months"
          :key="month.ts"
          class="vod__month-label"
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

const themeStyles = computed(() => {
  const theme = config.theme
  return {
    '--vod-primary': theme.primary,
    '--vod-bg': theme.background,
    '--vod-surface': theme.surface,
    '--vod-border': theme.border,
    '--vod-text': theme.text,
    '--vod-text-muted': theme.textMuted,
    '--vod-radius': theme.radius,
    '--vod-font': theme.font,
    '--vod-tooltip-bg': theme.tooltipBg,
    '--vod-tooltip-text': theme.tooltipText,
    '--vod-range-border': theme.rangeBorder,
    '--vod-range-bg': theme.rangeBackground,
    '--vod-track-image': theme.trackImage,
    '--vod-range-border-thickness': theme.rangeBorderThickness ,
  }
})

const selected = defineModel<DateRange>({ required: true })

// -- Constants & time bounds --
const DAY_MS = 1000 * 60 * 60 * 24
const currentYear = new Date().getFullYear()
const minTimestamp = new Date(currentYear, 0, 1).getTime()
const maxTimestamp = new Date(currentYear, 11, 31).getTime()

// -- Local state (array [startTimestamp, endTimestamp]) --
const localValue = shallowRef<[number, number]>([
  DateAdapter.toTimestamp(selected.value?.start) ?? minTimestamp,
  DateAdapter.toTimestamp(selected.value?.end) ?? maxTimestamp,
])


const propagateChange = () => {
  const [start, end] = localValue.value
  
  const currentStart = DateAdapter.toTimestamp(selected.value?.start)
  const currentEnd = DateAdapter.toTimestamp(selected.value?.end)

  if (start !== currentStart || end !== currentEnd) {
    selected.value = { 
      start: DateAdapter.fromTimestamp(start), 
      end: DateAdapter.fromTimestamp(end)
    }
  }
}

// -- Synchronization between owl-date-picker and its parent --
watch(selected, (value) => {
  if (!value) {
    return
  }
  const startTimestamp = DateAdapter.toTimestamp(value.start) ?? minTimestamp
  const endTimestamp   = DateAdapter.toTimestamp(value.end) ?? maxTimestamp
  // Update localValue ONLY if timestamps are different
  if (startTimestamp !== localValue.value[0] || endTimestamp !== localValue.value[1]) {
    localValue.value = [startTimestamp, endTimestamp]
  }
}, { deep: true })

// -- Percentage positions on the track --
const startPercent = computed(() => {
  return getPercentageForTimestamp(localValue.value[0])
})
const endPercent = computed(() => {
  return getPercentageForTimestamp(localValue.value[1])
})

const durationInDays = computed(() => {
  return Math.max(1, Math.round((localValue.value[1] - localValue.value[0]) / DAY_MS))
})

const centerOfRangePercentage = computed(() => {
  return getPercentageForTimestamp((localValue.value[0] + localValue.value[1]) / 2)
})

// -- Shortcuts (Presets) --
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
  propagateChange()
}

// Reset active preset if user manually moves handles
watch(localValue, (newVal) => {
  if (!activePreset.value) {
    return
  }
  const preset = presets.find(p => p.label === activePreset.value)
  if (!preset) {
    return
  }
  const [start, end] = preset.getRange()
  const tolerance = DAY_MS * 2
  if (
    Math.abs(newVal[0] - Math.max(minTimestamp, start)) > tolerance ||
    Math.abs(newVal[1] - Math.min(maxTimestamp, end)) > tolerance
  ) {
    activePreset.value = null
  }
})

// -- Formatting --
const formattedRangeString = computed(() => {
  const start = DateAdapter.fromTimestamp(localValue.value[0])
  const end = DateAdapter.fromTimestamp(localValue.value[1])
  if (!start || !end) {
    return ''
  }
  return DateAdapter.formatRange(start, end)
})

const getPercentageForTimestamp = (timestamp: number): number => {
  return ((timestamp - minTimestamp) / (maxTimestamp - minTimestamp)) * 100
}

const months = computed(() => {
  return DateAdapter.getYearMonths(currentYear)
})

// -- Drag & Drop (no external dependencies) --
const sliderTrackRef = ref<HTMLElement | null>(null)

const dragState = ref<{
  type: 'left' | 'right' | 'range' | null
  startX: number
  initialValue: [number, number]
}>({ type: null, startX: 0, initialValue: [0, 0] })

const snapToDay = (timestamp: number): number => {
  return minTimestamp + Math.round((timestamp - minTimestamp) / DAY_MS) * DAY_MS
}

const startDrag = (type: 'left' | 'right' | 'range', event: PointerEvent) => {
  if (event.button !== 0) {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  dragState.value = { type, startX: event.clientX, initialValue: [...localValue.value] }
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

const onPointerDownLeft  = (event: PointerEvent) => {
  return startDrag('left', event)
}
const onPointerDownRight = (event: PointerEvent) => {
  return startDrag('right', event)
}
const onPointerDownRange = (event: PointerEvent) => {
  return startDrag('range', event)
}

/** Direct click on the track: snaps to the nearest handle */
const onPointerDownTrack = (event: PointerEvent) => {
  if (event.button !== 0 || !sliderTrackRef.value) {
    return
  }
  event.preventDefault()

  const rect = sliderTrackRef.value.getBoundingClientRect()
  const clickPercent = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
  const clickTimestamp = snapToDay(minTimestamp + (clickPercent / 100) * (maxTimestamp - minTimestamp))

  const distLeft  = Math.abs(clickTimestamp - localValue.value[0])
  const distRight = Math.abs(clickTimestamp - localValue.value[1])

  if (distLeft <= distRight) {
    localValue.value = [Math.min(clickTimestamp, localValue.value[1] - DAY_MS), localValue.value[1]]
    propagateChange()
    startDrag('left', event)
  } else {
    localValue.value = [localValue.value[0], Math.max(clickTimestamp, localValue.value[0] + DAY_MS)]
    propagateChange()
    startDrag('right', event)
  }
}

const onPointerMove = (event: PointerEvent) => {
  if (!dragState.value.type || !sliderTrackRef.value) {
    return
  }

  const rect        = sliderTrackRef.value.getBoundingClientRect()
  const shiftTimestamp     = ((event.clientX - dragState.value.startX) / rect.width) * (maxTimestamp - minTimestamp)

  let [newStart, newEnd] = dragState.value.initialValue

  if (dragState.value.type === 'left') {
    newStart = Math.max(minTimestamp, Math.min(newEnd - DAY_MS, snapToDay(newStart + shiftTimestamp)))
  } else if (dragState.value.type === 'right') {
    newEnd = Math.min(maxTimestamp, Math.max(newStart + DAY_MS, snapToDay(newEnd + shiftTimestamp)))
  } else {
    // Move the entire range block
    const shiftDays = Math.round(shiftTimestamp / DAY_MS)
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
    propagateChange()
  }
}

const onPointerUp = () => {
  dragState.value.type = null
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)
}

// Cleanup on unmount to prevent memory leaks
onBeforeUnmount(onPointerUp)
</script>

<style lang="scss" src="./OwlDatePicker.scss"></style>
