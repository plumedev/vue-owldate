<template>
  <div class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-5 w-full min-w-[800px] font-sans">
    
    <!-- En-tête : Dates et Filtres -->
    <div class="flex justify-between items-center mb-10">
      <div class="text-[14px] font-semibold text-neutral-800">
        {{ formattedRangeString }}
      </div>
      
      <!-- Boutons de raccourcis -->
      <div class="flex bg-neutral-100 p-1 rounded-[8px] gap-1">
        <button 
          v-for="preset in presets" 
          :key="preset.label"
          @click="applyPreset(preset)"
          :class="['px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200',
                   activePreset === preset.label ? 'bg-white shadow-sm text-neutral-900 border border-neutral-200/50' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50']"
        >
          {{ preset.label }}
        </button>
      </div>
    </div>

    <!-- Zone du Slider de Timeline -->
    <div class="relative w-full px-4 pb-6 pt-2">
      <!-- Info-bulle flottante (ex: "74 Jours") -->
      <div 
        class="absolute -top-9 px-3 py-1.5 bg-neutral-900 text-white rounded-[6px] shadow-md text-[12px] font-medium pointer-events-none z-10 whitespace-nowrap transition-all duration-100"
        :style="{ left: `calc(${centerOfRangePercentage}%)`, transform: 'translateX(-50%)' }"
        v-if="durationInDays > 0"
      >
        {{ durationInDays }} Jours
        <!-- Petite flèche pour l'info-bulle (caret) -->
        <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-neutral-900 rotate-45"></div>
      </div>

      <!-- Le composant Slider Réécrit Sans Dépendance -->
      <div class="relative w-full h-10 touch-none select-none mt-2 group py-2" ref="sliderTrackRef">
        
        <!-- Piste (Track) avec le fond texturé -->
        <div 
          class="absolute inset-0 rounded-[8px] overflow-hidden bg-neutral-50/50 bg-[url('@/assets/graduation.svg')] bg-repeat-x bg-center cursor-pointer" 
          @pointerdown="onPointerDownTrack"
        >
          <!-- Zone active (Range) bleue transparente -->
          <div 
            class="absolute h-full bg-primary-500/[0.12] border-y-2 border-primary-500/40 backdrop-filter backdrop-saturate-[1.2]"
            :class="dragState.type === 'range' ? 'cursor-grabbing' : 'cursor-grab'"
            :style="{ left: startPercent + '%', width: (endPercent - startPercent) + '%' }"
            @pointerdown="onPointerDownRange"
          ></div>
        </div>
        
        <!-- Bordure par-dessus la piste pour éviter toute interférence de dimensions (Box Sizing) -->
        <div class="absolute inset-0 rounded-[8px] border border-neutral-200 pointer-events-none"></div>

        <!-- Poignée gauche -->
        <div 
          class="absolute top-1/2 w-0 h-0 cursor-ew-resize focus:outline-none after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:bg-[url('@/assets/graduation-thumb.svg')] after:bg-no-repeat after:bg-center after:bg-contain after:w-[20px] after:h-[32px] after:transition-transform after:duration-[150ms] after:ease-out hover:after:scale-[1.15] focus:after:scale-[1.15] z-10"
          :style="{ left: startPercent + '%' }"
          @pointerdown="onPointerDownLeft"
          role="slider"
          tabindex="0"
          aria-label="Date de début"
        ></div>

        <!-- Poignée droite -->
        <div 
          class="absolute top-1/2 w-0 h-0 cursor-ew-resize focus:outline-none after:content-[''] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:bg-[url('@/assets/graduation-thumb.svg')] after:bg-no-repeat after:bg-center after:bg-contain after:w-[20px] after:h-[32px] after:transition-transform after:duration-[150ms] after:ease-out hover:after:scale-[1.15] focus:after:scale-[1.15] z-10"
          :style="{ left: endPercent + '%' }"
          @pointerdown="onPointerDownRight"
          role="slider"
          tabindex="0"
          aria-label="Date de fin"
        ></div>
      </div>
      
      <!-- Étiquettes des mois en bas -->
      <div class="relative w-full h-4 mt-4">
        <div 
          v-for="month in months" 
          :key="month.ts" 
          class="absolute text-[11px] text-neutral-400 font-medium capitalize pointer-events-none"
          :style="{ left: `${getPercentageForTimestamp(month.ts)}%`, transform: 'translateX(-50%)' }"
        >
          {{ month.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onBeforeUnmount, watch } from 'vue';
import type { DateRange } from './src/types';

const selected = defineModel<DateRange>({ required: true });

// === Constantes & Bornes temporelles ===
const dayInMilliseconds = 1000 * 60 * 60 * 24;
const currentYear = new Date().getFullYear();
const minTimestamp = new Date(currentYear, 0, 1).getTime();
const maxTimestamp = new Date(currentYear, 11, 31).getTime();

// === État local ===
const localValue = computed({
  get: () => [selected.value?.start?.getTime() || minTimestamp, selected.value?.end?.getTime() || maxTimestamp],
  set: (val) => selected.value = { start: new Date(val[0]), end: new Date(val[1]) }
});

const startPercent = computed(() => getPercentageForTimestamp(localValue.value[0]));
const endPercent = computed(() => getPercentageForTimestamp(localValue.value[1]));

const durationInDays = computed(() => {
  return Math.max(1, Math.round((localValue.value[1] - localValue.value[0]) / dayInMilliseconds));
});

const centerOfRangePercentage = computed(() => {
  const centerTs = (localValue.value[0] + localValue.value[1]) / 2;
  return getPercentageForTimestamp(centerTs);
});

// === Raccourcis (Presets) ===
const activePreset = ref<string | null>(null);

const presets = [
  { label: 'Ce mois', getRange: () => {
    const today = new Date();
    return [new Date(today.getFullYear(), today.getMonth(), 1).getTime(), new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).getTime()]
  }},
  { label: '7J', getRange: () => {
    const end = new Date();
    const start = new Date(end.getTime() - 7 * dayInMilliseconds);
    return [start.getTime(), end.getTime()]
  }},
  { label: '30J', getRange: () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * dayInMilliseconds);
    return [start.getTime(), end.getTime()]
  }},
  { label: '90J', getRange: () => {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * dayInMilliseconds);
    return [start.getTime(), end.getTime()]
  }}
];

const applyPreset = (preset: typeof presets[0]) => {
  activePreset.value = preset.label;
  const [start, end] = preset.getRange();
  const clampedStart = Math.max(minTimestamp, start);
  const clampedEnd = Math.min(maxTimestamp, end);
  localValue.value = [clampedStart, clampedEnd];
};

watch(localValue, (newVal) => {
  if (activePreset.value) {
    const preset = presets.find(p => p.label === activePreset.value);
    if (preset) {
      const [start, end] = preset.getRange();
      const tolerance = dayInMilliseconds * 2;
      if (Math.abs(newVal[0] - Math.max(minTimestamp, start)) > tolerance || 
          Math.abs(newVal[1] - Math.min(maxTimestamp, end)) > tolerance) {
        activePreset.value = null;
      }
    }
  }
});

// === Formatage ===
const formattedRangeString = computed(() => {
  const start = new Date(localValue.value[0]);
  const end = new Date(localValue.value[1]);
  const today = new Date();
  
  const df = new Intl.DateTimeFormat('fr-FR', { month: 'long', day: 'numeric' });
  const startStr = df.format(start);
  
  let endStr = df.format(end);
  if (end.toDateString() === today.toDateString()) {
    endStr = "Aujourd'hui";
  }
  
  return `${startStr.charAt(0).toUpperCase() + startStr.slice(1)} – ${endStr.charAt(0).toUpperCase() + endStr.slice(1)}`;
});

const getPercentageForTimestamp = (ts: number) => {
  return ((ts - minTimestamp) / (maxTimestamp - minTimestamp)) * 100;
};

const months = computed(() => {
  const m = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(currentYear, i, 15);
    m.push({
      label: new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(d).replace('.', ''),
      ts: d.getTime()
    });
  }
  return m;
});

// ==========================================================
// === LOGIQUE DE DRAG & DROP "PURE VUE" (SANS COMPOSANT) ===
// ==========================================================
const sliderTrackRef = ref<HTMLElement | null>(null);

const dragState = ref<{
  type: 'left' | 'right' | 'range' | null;
  startX: number;
  initialValue: [number, number];
}>({ type: null, startX: 0, initialValue: [0, 0] });

const snapToDay = (ts: number) => {
  return minTimestamp + Math.round((ts - minTimestamp) / dayInMilliseconds) * dayInMilliseconds;
};

const startDrag = (type: 'left' | 'right' | 'range', event: PointerEvent) => {
  if (event.button !== 0) return; // Uniquement le clic gauche
  event.preventDefault();
  event.stopPropagation();
  
  dragState.value = {
    type,
    startX: event.clientX,
    initialValue: [...localValue.value] as [number, number]
  };
  
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
};

// Intercepteurs pour les poignées et la zone de sélection (le range bleu)
const onPointerDownLeft = (e: PointerEvent) => startDrag('left', e);
const onPointerDownRight = (e: PointerEvent) => startDrag('right', e);
const onPointerDownRange = (e: PointerEvent) => startDrag('range', e);

// Clic spécifique sur le fond de la piste (Track) pour aspirer la poignée la plus proche
const onPointerDownTrack = (e: PointerEvent) => {
  if (e.button !== 0 || !sliderTrackRef.value) return;
  e.preventDefault();
  
  const rect = sliderTrackRef.value.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickPercent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
  const clickTs = snapToDay(minTimestamp + (clickPercent / 100) * (maxTimestamp - minTimestamp));
  
  const distLeft = Math.abs(clickTs - localValue.value[0]);
  const distRight = Math.abs(clickTs - localValue.value[1]);
  
  if (distLeft <= distRight) {
    // Si on est plus proche de la gauche, on amène la poignée gauche
    localValue.value = [Math.min(clickTs, localValue.value[1] - dayInMilliseconds), localValue.value[1]];
    startDrag('left', e); // Lance le drag direct dans la foulée
  } else {
    // Sinon on amène la poignée droite
    localValue.value = [localValue.value[0], Math.max(clickTs, localValue.value[0] + dayInMilliseconds)];
    startDrag('right', e);
  }
};

const onPointerMove = (event: PointerEvent) => {
  if (!dragState.value.type || !sliderTrackRef.value) return;
  
  const rect = sliderTrackRef.value.getBoundingClientRect();
  const shiftAmount = event.clientX - dragState.value.startX;
  const shiftPercent = (shiftAmount / rect.width) * 100;
  const shiftTs = (shiftPercent / 100) * (maxTimestamp - minTimestamp);
  
  let [newStart, newEnd] = dragState.value.initialValue;
  
  if (dragState.value.type === 'left') {
    newStart = snapToDay(newStart + shiftTs);
    // On bloque contre la limite de l'année et on respecte l'écart de base par rapport à la poignée droite
    newStart = Math.max(minTimestamp, Math.min(newEnd - dayInMilliseconds, newStart));
  } 
  else if (dragState.value.type === 'right') {
    newEnd = snapToDay(newEnd + shiftTs);
    // On bloque contre la limite de l'année et par rapport à la poignée gauche
    newEnd = Math.min(maxTimestamp, Math.max(newStart + dayInMilliseconds, newEnd));
  } 
  else if (dragState.value.type === 'range') {
    const shiftDays = Math.round(shiftTs / dayInMilliseconds);
    const duration = newEnd - newStart;
    
    let targetStart = newStart + shiftDays * dayInMilliseconds;
    let targetEnd = newEnd + shiftDays * dayInMilliseconds;
    
    // Contraintes pour bloquer le groupe entier contre les bords de l'année
    if (targetStart < minTimestamp) {
      targetStart = minTimestamp;
      targetEnd = targetStart + duration;
    } else if (targetEnd > maxTimestamp) {
      targetEnd = maxTimestamp;
      targetStart = targetEnd - duration;
    }
    
    newStart = targetStart;
    newEnd = targetEnd;
  }
  
  if (newStart !== localValue.value[0] || newEnd !== localValue.value[1]) {
    localValue.value = [newStart, newEnd];
  }
};

const onPointerUp = () => {
  dragState.value.type = null;
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
  window.removeEventListener('pointercancel', onPointerUp);
};

// Nettoyage de l'événement en cas de démontage composant pour fuites mémoire
onBeforeUnmount(onPointerUp);
</script>
