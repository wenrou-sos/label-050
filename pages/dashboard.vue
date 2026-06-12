<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">传感器总数</p>
            <p class="text-3xl font-bold text-slate-800 mt-1">{{ stats?.totalSensors || 0 }}</p>
            <p class="text-xs text-green-600 mt-1">
              在线 {{ stats?.onlineSensors || 0 }} / 离线 {{ stats?.offlineSensors || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">活跃告警</p>
            <p class="text-3xl font-bold text-red-600 mt-1">{{ stats?.activeAlerts || 0 }}</p>
            <div class="flex gap-2 mt-1 text-xs">
              <span class="text-red-600">严重: {{ stats?.alertCounts?.critical || 0 }}</span>
              <span class="text-orange-600">一般: {{ stats?.alertCounts?.general || 0 }}</span>
              <span class="text-yellow-600">预警: {{ stats?.alertCounts?.warning || 0 }}</span>
            </div>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">待处理工单</p>
            <p class="text-3xl font-bold text-orange-600 mt-1">{{ stats?.pendingWorkOrders || 0 }}</p>
            <p class="text-xs text-slate-500 mt-1">
              24小时内记录: {{ stats?.records24h || 0 }}
            </p>
          </div>
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
            </svg>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-500">温度达标率</p>
            <p class="text-3xl font-bold" :class="complianceColor" mt-1>{{ stats?.complianceRate?.toFixed(2) || 0 }}%</p>
            <p class="text-xs text-slate-500 mt-1">
              平均温度: {{ stats?.avgTemperature?.toFixed(1) || '--' }}°C
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-slate-800">实时温度监控</h3>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-500">筛选:</span>
          <select v-model="filterLocation" class="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部位置</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <TemperatureGauge
          v-for="sensor in filteredSensors"
          :key="sensor.id"
          :id="sensor.id"
          :name="sensor.name"
          :location-name="sensor.locationName"
          :temperature="sensor.currentTemp"
          :min-temp="sensor.minTemp"
          :max-temp="sensor.maxTemp"
          :warning-min="sensor.warningMin"
          :warning-max="sensor.warningMax"
          :status="sensor.status"
          :last-update="sensor.lastUpdate"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-slate-800">温度趋势图</h3>
          <select v-model="chartSensorId" class="text-sm border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option v-for="sensor in sensors" :key="sensor.id" :value="sensor.id">{{ sensor.name }}</option>
          </select>
        </div>
        <div class="h-64">
          <Line v-if="chartData" :data="chartData" :options="chartOptions" />
        </div>
      </div>

      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">最新告警</h3>
        <div class="space-y-3 max-h-64 overflow-y-auto">
          <div
            v-for="alert in recentAlerts"
            :key="alert.id"
            class="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
            :class="{
              'bg-red-50 border border-red-100': alert.level === 'critical',
              'bg-orange-50 border border-orange-100': alert.level === 'warning',
              'bg-yellow-50 border border-yellow-100': alert.level === 'general'
            }"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-red-100 text-red-600': alert.level === 'critical',
                'bg-orange-100 text-orange-600': alert.level === 'warning',
                'bg-yellow-100 text-yellow-600': alert.level === 'general'
              }"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-sm text-slate-800 truncate">{{ alert.title }}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  :class="{
                    'bg-red-100 text-red-700': alert.level === 'critical',
                    'bg-orange-100 text-orange-700': alert.level === 'warning',
                    'bg-yellow-100 text-yellow-700': alert.level === 'general'
                  }"
                >
                  {{ alert.level === 'critical' ? '严重' : alert.level === 'warning' ? '预警' : '一般' }}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">{{ alert.sensorName }} · {{ formatTime(alert.createdAt) }}</p>
              <p class="text-xs text-slate-600 mt-1">当前温度: <span class="font-medium">{{ alert.temperature }}°C</span></p>
            </div>
          </div>
          <div v-if="!recentAlerts.length" class="text-center py-8 text-slate-500">
            暂无告警
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const { get } = useApi()

const stats = ref<any>(null)
const sensors = ref<any[]>([])
const locations = ref<any[]>([])
const recentAlerts = ref<any[]>([])
const filterLocation = ref<number | ''>('')
const chartSensorId = ref<number>(1)
const chartData = ref<any>(null)
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      grid: {
        color: '#f1f5f9'
      }
    }
  }
}

let dataInterval: ReturnType<typeof setInterval> | null = null

const filteredSensors = computed(() => {
  if (!filterLocation.value) return sensors.value
  return sensors.value.filter(s => s.locationId === filterLocation.value)
})

const complianceColor = computed(() => {
  const rate = stats.value?.complianceRate || 100
  if (rate >= 98) return 'text-green-600'
  if (rate >= 95) return 'text-yellow-600'
  return 'text-red-600'
})

const fetchStats = async () => {
  try {
    const result = await get('/api/dashboard/stats')
    if (result?.success) {
      stats.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const fetchSensors = async () => {
  try {
    const result = await get('/api/sensors', { pageSize: 100 })
    if (result?.success) {
      sensors.value = result.data
      if (!chartSensorId.value && result.data.length > 0) {
        chartSensorId.value = result.data[0].id
      }
    }
  } catch (e) {
    console.error('Failed to fetch sensors:', e)
  }
}

const fetchLocations = async () => {
  try {
    const result = await get('/api/locations')
    if (result?.success) {
      locations.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch locations:', e)
  }
}

const fetchRecentAlerts = async () => {
  try {
    const result = await get('/api/alerts', { pageSize: 5, status: 'pending' })
    if (result?.success) {
      recentAlerts.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch alerts:', e)
  }
}

const fetchChartData = async () => {
  if (!chartSensorId.value) return
  try {
    const result = await get('/api/temperature/chart', {
      sensorId: chartSensorId.value,
      hours: 24
    })
    if (result?.success) {
      const data = result.data
      const sensor = sensors.value.find(s => s.id === chartSensorId.value)
      chartData.value = {
        labels: data.labels,
        datasets: [
          {
            label: '温度',
            data: data.temperatures,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          },
          {
            label: '预警上限',
            data: new Array(data.labels.length).fill(sensor?.warningMax || 8),
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            pointRadius: 0
          },
          {
            label: '预警下限',
            data: new Array(data.labels.length).fill(sensor?.warningMin || 2),
            borderColor: '#f59e0b',
            borderDash: [5, 5],
            pointRadius: 0
          }
        ]
      }
    }
  } catch (e) {
    console.error('Failed to fetch chart data:', e)
  }
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return date.toLocaleString('zh-CN')
}

watch(chartSensorId, () => {
  fetchChartData()
})

onMounted(() => {
  fetchStats()
  fetchSensors()
  fetchLocations()
  fetchRecentAlerts()

  dataInterval = setInterval(() => {
    fetchStats()
    fetchSensors()
    fetchRecentAlerts()
    fetchChartData()
  }, 5000)
})

onUnmounted(() => {
  if (dataInterval) {
    clearInterval(dataInterval)
  }
})
</script>
