<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">历史温度追溯</h2>
        <p class="text-sm text-slate-500 mt-1">查询和分析历史温度数据</p>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">传感器</label>
          <select v-model="filters.sensorId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部传感器</option>
            <option v-for="sensor in sensors" :key="sensor.id" :value="sensor.id">{{ sensor.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">位置</label>
          <select v-model="filters.locationId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部位置</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">开始时间</label>
          <input type="datetime-local" v-model="filters.startTime" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">结束时间</label>
          <input type="datetime-local" v-model="filters.endTime" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">异常筛选</label>
          <select v-model="filters.isAbnormal" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部</option>
            <option value="true">仅异常</option>
            <option value="false">仅正常</option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button @click="fetchRecords" class="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            查询
          </button>
          <button @click="resetFilters" class="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
            重置
          </button>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-3">
        <span class="text-sm text-slate-500">快捷时间:</span>
        <button @click="setQuickRange('today')" class="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" :class="quickRange === 'today' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''">今天</button>
        <button @click="setQuickRange('week')" class="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" :class="quickRange === 'week' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''">近7天</button>
        <button @click="setQuickRange('month')" class="px-3 py-1 text-xs border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors" :class="quickRange === 'month' ? 'bg-blue-50 border-blue-300 text-blue-600' : ''">近30天</button>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-slate-800">温度趋势图</h3>
          <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input type="checkbox" v-model="showPrediction" class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
            <span>显示预测</span>
          </label>
          <select v-if="showPrediction" v-model="predictionMethod" class="text-sm border border-slate-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="auto">自动</option>
            <option value="linear">线性回归</option>
            <option value="sma">移动平均</option>
          </select>
          <span v-if="selectedCount > 0 && Object.keys(predictionInfo).length > 0" class="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            已选 {{ selectedCount }} 个传感器 · {{ showPrediction ? '预测已开启' : '预测已关闭' }}
          </span>
          <span v-if="Object.values(predictionInfo).some((p: any) => p.hasWarning)" class="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            {{ Object.values(predictionInfo).filter((p: any) => p.hasWarning).length }} 个传感器预测将超温
          </span>
        </div>
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative">
            <select
              multiple
              v-model="chartSensorIds"
              size="4"
              class="min-w-[180px] h-[110px] text-sm border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
            >
              <option v-for="sensor in sensors" :key="sensor.id" :value="sensor.id">
                {{ sensor.name }}
              </option>
            </select>
            <div class="text-xs text-slate-400 mt-1">
              已选 {{ selectedCount }} 个 (按住 Ctrl 多选)
            </div>
          </div>
          <button @click="fetchChartData" class="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
            刷新图表
          </button>
        </div>
      </div>
      <div class="h-72">
        <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        <div v-else class="h-full flex items-center justify-center text-slate-400">
          <div class="text-center">
            <svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
            </svg>
            <p>请选择传感器和时间范围查看趋势图</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 flex items-center justify-between border-b border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800">温度记录</h3>
        <div class="flex items-center gap-2">
          <button @click="exportData('csv')" class="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            导出CSV
          </button>
          <button @click="exportData('excel')" class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            导出Excel
          </button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">传感器</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">位置</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">温度</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">预警范围</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">记录时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="record in records" :key="record.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-slate-800">{{ record.sensorName }}</div>
                <div class="text-xs text-slate-400 font-mono">{{ record.sensorCode }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ record.locationName || '-' }}</td>
              <td class="px-4 py-3">
                <span class="text-sm font-semibold" :class="record.isAbnormal ? 'text-red-600' : 'text-green-600'">
                  {{ record.temperature }}°C
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ record.warningMin }}°C ~ {{ record.warningMax }}°C
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="record.isAbnormal ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="record.isAbnormal ? 'bg-red-500' : 'bg-green-500'"></span>
                  {{ record.isAbnormal ? (record.abnormalType === 'high' ? '温度过高' : '温度过低') : '正常' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">{{ formatDateTime(record.recordTime) }}</td>
            </tr>
            <tr v-if="!loading && records.length === 0">
              <td colspan="6" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p class="text-slate-500">暂无数据，请设置查询条件</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="loading" class="py-12 flex items-center justify-center">
        <svg class="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <div v-if="!loading && totalPages > 1" class="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          共 {{ total }} 条记录，第 {{ page }} / {{ totalPages }} 页
        </div>
        <div class="flex items-center gap-2">
          <button @click="changePage(1)" :disabled="page === 1" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">首页</button>
          <button @click="changePage(page - 1)" :disabled="page === 1" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">上一页</button>
          <div class="flex items-center gap-1">
            <button v-for="p in visiblePages" :key="p" @click="changePage(p)" class="w-9 h-9 text-sm rounded-lg transition-colors" :class="{ 'bg-blue-600 text-white': p === page, 'border border-slate-300 hover:bg-slate-50': p !== page }">{{ p }}</button>
          </div>
          <button @click="changePage(page + 1)" :disabled="page === totalPages" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">下一页</button>
          <button @click="changePage(totalPages)" :disabled="page === totalPages" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">末页</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const { get, request } = useApi()

const records = ref<any[]>([])
const sensors = ref<any[]>([])
const locations = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)
const quickRange = ref('')

const filters = ref({
  sensorId: '' as number | string,
  locationId: '' as number | string,
  startTime: '',
  endTime: '',
  isAbnormal: '' as string
})

const chartSensorIds = ref<number[]>([])
const chartData = ref<any>(null)
const showPrediction = ref(true)
const predictionMethod = ref<'auto' | 'linear' | 'sma'>('auto')
const predictionInfo = ref<{ [key: number]: any }>({})
const selectedCount = computed(() => chartSensorIds.value.length)

const SENSOR_COLORS = [
  { border: '#3b82f6', fill: 'rgba(59, 130, 246, 0.1)', pred: '#8b5cf6', ci: 'rgba(139, 92, 246, 0.12)' },
  { border: '#10b981', fill: 'rgba(16, 185, 129, 0.1)', pred: '#059669', ci: 'rgba(16, 185, 129, 0.12)' },
  { border: '#f97316', fill: 'rgba(249, 115, 22, 0.1)', pred: '#ea580c', ci: 'rgba(249, 115, 22, 0.12)' },
  { border: '#ec4899', fill: 'rgba(236, 72, 153, 0.1)', pred: '#db2777', ci: 'rgba(236, 72, 153, 0.12)' },
  { border: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)', pred: '#0891b2', ci: 'rgba(6, 182, 212, 0.12)' },
  { border: '#a855f7', fill: 'rgba(168, 85, 247, 0.1)', pred: '#9333ea', ci: 'rgba(168, 85, 247, 0.12)' },
  { border: '#84cc16', fill: 'rgba(132, 204, 22, 0.1)', pred: '#65a30d', ci: 'rgba(132, 204, 22, 0.12)' },
  { border: '#e11d48', fill: 'rgba(225, 29, 72, 0.1)', pred: '#be123c', ci: 'rgba(225, 29, 72, 0.12)' }
]

const getSensorColor = (idx: number) => SENSOR_COLORS[idx % SENSOR_COLORS.length]
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'top' as const },
    tooltip: {
      mode: 'index' as const,
      intersect: false
    }
  },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: '#f1f5f9' } }
  }
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const t = totalPages.value
  const c = page.value
  if (t <= 7) {
    for (let i = 1; i <= t; i++) pages.push(i)
  } else if (c <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push(t)
  } else if (c >= t - 3) {
    pages.push(1)
    for (let i = t - 4; i <= t; i++) pages.push(i)
  } else {
    pages.push(1)
    for (let i = c - 1; i <= c + 1; i++) pages.push(i)
    pages.push(t)
  }
  return pages
})

const setQuickRange = (range: string) => {
  quickRange.value = range
  const now = new Date()
  let start: Date
  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (range === 'week') {
    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  } else {
    start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
  filters.value.startTime = formatInputDatetime(start)
  filters.value.endTime = formatInputDatetime(now)
  fetchRecords()
}

const formatInputDatetime = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const fetchSensors = async () => {
  try {
    const result = await get('/api/sensors', { pageSize: 100 })
    if (result?.success) {
      sensors.value = result.data
      if (chartSensorIds.value.length === 0 && result.data.length > 0) {
        chartSensorIds.value = [result.data[0].id]
      }
    }
  } catch (e) {
    console.error('Failed to fetch sensors:', e)
  }
}

const fetchLocations = async () => {
  try {
    const result = await get('/api/locations', { status: 'active' })
    if (result?.success) {
      locations.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch locations:', e)
  }
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const params: any = { page: page.value, pageSize: pageSize.value }
    if (filters.value.sensorId) params.sensorId = filters.value.sensorId
    if (filters.value.locationId) params.locationId = filters.value.locationId
    if (filters.value.startTime) params.startTime = filters.value.startTime
    if (filters.value.endTime) params.endTime = filters.value.endTime
    if (filters.value.isAbnormal) params.isAbnormal = filters.value.isAbnormal

    const result = await get('/api/temperature/records', params)
    if (result?.success) {
      records.value = result.data
      total.value = result.total
      totalPages.value = result.totalPages
    }
  } catch (e) {
    console.error('Failed to fetch records:', e)
  } finally {
    loading.value = false
  }
}

const fetchPrediction = async () => {
  if (chartSensorIds.value.length === 0 || !showPrediction.value) return null
  try {
    const result = await get('/api/temperature/predict', {
      sensorIds: chartSensorIds.value.join(','),
      hours: 24,
      steps: 12,
      stepIntervalSec: 300,
      method: predictionMethod.value
    })
    return result?.success ? result.data : null
  } catch (e) {
    console.error('Failed to fetch prediction:', e)
    return null
  }
}

const fetchChartData = async () => {
  if (chartSensorIds.value.length === 0) return
  try {
    const params: any = { sensorIds: chartSensorIds.value.join(',') }
    if (filters.value.startTime) params.startTime = filters.value.startTime
    if (filters.value.endTime) params.endTime = filters.value.endTime
    else {
      const now = new Date()
      params.endTime = now.toISOString()
      params.startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }

    const [chartResult, predictionRaw] = await Promise.all([
      get('/api/temperature/chart', params),
      fetchPrediction()
    ])

    if (chartResult?.success && chartResult.data) {
      const { labels, series } = chartResult.data
      const predictions = predictionRaw
        ? (Array.isArray(predictionRaw) ? predictionRaw : [predictionRaw])
        : []

      predictionInfo.value = {}
      predictions.forEach((p: any) => {
        if (p && p.sensorId) {
          predictionInfo.value[p.sensorId] = {
            method: p.method,
            rSquared: p.rSquared,
            hasWarning: p.warningPoints && p.warningPoints.length > 0,
            lastRecordTime: p.lastRecordTime || '',
            lastTemperature: p.lastTemperature || 0,
            sensorName: p.sensorName
          }
        }
      })

      const datasets: any[] = []
      let mergedLabels = [...labels]
      let predLabels: string[] = []

      if (predictions.length > 0 && predictions[0].labels && predictions[0].labels.length > 0) {
        predLabels = predictions[0].labels
        mergedLabels = [...labels, ...predLabels]
      }

      const predPlaceholderLen = labels.length
      const globalWarningMax = Math.min(...series.map((s: any) => s.warningMax))
      const globalWarningMin = Math.max(...series.map((s: any) => s.warningMin))

      series.forEach((s: any, idx: number) => {
        const color = getSensorColor(idx)
        const paddedTemps = predLabels.length > 0
          ? [...s.temperatures, ...new Array(predLabels.length).fill(null)]
          : s.temperatures

        datasets.push({
          label: s.sensorName,
          data: paddedTemps,
          borderColor: color.border,
          backgroundColor: color.fill,
          fill: true,
          tension: 0.4,
          pointRadius: s.temperatures.filter((t: any) => t !== null).length > 100 ? 0 : 3,
          order: 10 + idx
        })

        if (showPrediction.value) {
          const pred = predictions.find((p: any) => p.sensorId === s.sensorId)
          if (pred && pred.labels.length > 0) {
            const predDataArr = new Array(predPlaceholderLen).fill(null).concat(pred.predicted)
            const lowerBoundArr = new Array(predPlaceholderLen).fill(null).concat(pred.lowerBound)
            const upperBoundArr = new Array(predPlaceholderLen).fill(null).concat(pred.upperBound)

            datasets.push(
              {
                label: `${s.sensorName} - 95%置信上限`,
                data: upperBoundArr,
                borderColor: 'transparent',
                backgroundColor: color.ci,
                pointRadius: 0,
                fill: `+1`,
                tension: 0.4,
                order: 100 + idx * 3
              },
              {
                label: `${s.sensorName} - 95%置信下限`,
                data: lowerBoundArr,
                borderColor: 'transparent',
                backgroundColor: color.ci,
                pointRadius: 0,
                fill: false,
                tension: 0.4,
                order: 101 + idx * 3
              },
              {
                label: `${s.sensorName} - 预测`,
                data: predDataArr,
                borderColor: color.pred,
                borderDash: [8, 4],
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: color.pred,
                fill: false,
                tension: 0.4,
                order: 50 + idx
              }
            )

            if (pred.warningPoints && pred.warningPoints.length > 0) {
              const warningPointData = new Array(mergedLabels.length).fill(null)
              pred.warningPoints.forEach((wp: { label: string; value: number }) => {
                const labelIdx = mergedLabels.indexOf(wp.label)
                if (labelIdx >= 0) warningPointData[labelIdx] = wp.value
              })
              datasets.push({
                label: `${s.sensorName} - 超温预警`,
                data: warningPointData,
                borderColor: 'transparent',
                backgroundColor: '#ef4444',
                pointRadius: 8,
                pointStyle: 'triangle',
                pointBackgroundColor: '#ef4444',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                showLine: false,
                order: 1
              })
            }
          }
        }
      })

      const warningMaxArrFull = new Array(mergedLabels.length).fill(globalWarningMax)
      const warningMinArrFull = new Array(mergedLabels.length).fill(globalWarningMin)

      datasets.push(
        {
          label: '预警上限',
          data: warningMaxArrFull,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          order: 5
        },
        {
          label: '预警下限',
          data: warningMinArrFull,
          borderColor: '#f59e0b',
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
          order: 6
        }
      )

      chartData.value = {
        labels: mergedLabels,
        datasets
      }
    }
  } catch (e) {
    console.error('Failed to fetch chart data:', e)
  }
}

const resetFilters = () => {
  filters.value = { sensorId: '', locationId: '', startTime: '', endTime: '', isAbnormal: '' }
  quickRange.value = ''
  page.value = 1
  fetchRecords()
}

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchRecords()
}

const { token } = useAuth()

const exportData = async (format: string) => {
  const params = new URLSearchParams()
  params.set('format', format)
  if (filters.value.sensorId) params.set('sensorId', String(filters.value.sensorId))
  if (filters.value.locationId) params.set('locationId', String(filters.value.locationId))
  if (filters.value.startTime) params.set('startTime', filters.value.startTime)
  if (filters.value.endTime) params.set('endTime', filters.value.endTime)

  const url = `/api/temperature/export?${params.toString()}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (!response.ok) {
      throw new Error('导出失败')
    }

    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    const ext = format === 'excel' ? 'xlsx' : 'csv'
    link.download = `temperature_records_${Date.now()}.${ext}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (e) {
    console.error('Export failed:', e)
    alert('导出失败，请重试')
  }
}

watch(chartSensorIds, () => {
  fetchChartData()
}, { deep: true })

watch([showPrediction, predictionMethod], () => {
  fetchChartData()
})

onMounted(() => {
  fetchSensors()
  fetchLocations()
  setQuickRange('today')
})
</script>
