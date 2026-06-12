<template>
  <div class="relative w-full" :class="{ 'opacity-50': !isOnline }">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-slate-700">{{ name }}</span>
      <span :class="statusClass" class="text-xs px-2 py-0.5 rounded-full font-medium">
        {{ statusText }}
      </span>
    </div>
    <div class="relative h-32">
      <svg viewBox="0 0 100 60" class="w-full h-full">
        <defs>
          <linearGradient :id="'gauge-gradient-' + id" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" :style="{ stopColor: colorLow }" />
            <stop offset="50%" :style="{ stopColor: colorNormal }" />
            <stop offset="100%" :style="{ stopColor: colorHigh }" />
          </linearGradient>
        </defs>
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="#e2e8f0"
          stroke-width="8"
          stroke-linecap="round"
        />
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          :stroke="'url(#gauge-gradient-' + id + ')'"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="arcLength"
          :stroke-dashoffset="arcOffset"
          class="transition-all duration-700 ease-out"
        />
        <circle cx="50" cy="55" r="4" :fill="currentColor" />
        <line
          x1="50"
          y1="55"
          :x2="needleX"
          :y2="needleY"
          stroke="#1e293b"
          stroke-width="2"
          stroke-linecap="round"
          class="transition-all duration-700 ease-out"
        />
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center pt-8">
        <span class="text-3xl font-bold" :class="currentColor">
          {{ displayValue }}°C
        </span>
        <span class="text-xs text-slate-500">{{ locationName }}</span>
      </div>
    </div>
    <div class="flex justify-between text-xs text-slate-500 mt-1">
      <span>{{ minTemp }}°C</span>
      <span class="text-slate-400">预警范围: {{ warningMin }}°C ~ {{ warningMax }}°C</span>
      <span>{{ maxTemp }}°C</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  id: number
  name: string
  locationName?: string
  temperature: number | null
  minTemp: number
  maxTemp: number
  warningMin: number
  warningMax: number
  status?: string
  lastUpdate?: string
}>()

const isOnline = computed(() => props.status !== 'offline')

const displayValue = computed(() => {
  if (props.temperature === null || props.temperature === undefined) return '--'
  return props.temperature.toFixed(1)
})

const normalizedValue = computed(() => {
  if (props.temperature === null || props.temperature === undefined) return 0.5
  const clamped = Math.max(props.minTemp, Math.min(props.maxTemp, props.temperature))
  return (clamped - props.minTemp) / (props.maxTemp - props.minTemp)
})

const arcLength = 125.6
const arcOffset = computed(() => arcLength * (1 - normalizedValue.value))

const angle = computed(() => -135 + normalizedValue.value * 270)
const needleX = computed(() => 50 + 28 * Math.cos((angle.value * Math.PI) / 180))
const needleY = computed(() => 55 + 28 * Math.sin((angle.value * Math.PI) / 180))

const colorLow = '#3b82f6'
const colorNormal = '#22c55e'
const colorHigh = '#ef4444'

const currentColor = computed(() => {
  if (props.temperature === null || props.temperature === undefined) return 'text-slate-400'
  if (props.temperature < props.warningMin || props.temperature > props.warningMax) {
    return 'text-red-500'
  }
  return 'text-green-500'
})

const statusClass = computed(() => {
  if (!isOnline.value) return 'bg-slate-100 text-slate-600'
  if (props.temperature === null || props.temperature === undefined) return 'bg-slate-100 text-slate-600'
  if (props.temperature < props.warningMin || props.temperature > props.warningMax) {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-green-100 text-green-700'
})

const statusText = computed(() => {
  if (!isOnline.value) return '离线'
  if (props.temperature === null || props.temperature === undefined) return '无数据'
  if (props.temperature < props.warningMin) return '温度过低'
  if (props.temperature > props.warningMax) return '温度过高'
  return '正常'
})
</script>
