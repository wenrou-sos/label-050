<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">月度达标率报表</h2>
        <p class="text-sm text-slate-500 mt-1">温度达标率统计与分析</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="printReport" class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm inline-flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
          </svg>
          打印
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">报表月份</label>
          <input type="month" v-model="reportMonth" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">统计维度</label>
          <select v-model="groupBy" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="location">按仓库/车辆</option>
            <option value="sensor">按传感器</option>
            <option value="goods">按货物类型</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">位置筛选</label>
          <select v-model="filterLocationId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部位置</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="fetchReport" class="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
            生成报表
          </button>
        </div>
      </div>
    </div>

    <div v-if="reportData" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <p class="text-sm text-slate-500">总记录数</p>
        <p class="text-3xl font-bold text-slate-800 mt-1">{{ reportData.overall.totalRecords }}</p>
        <p class="text-xs text-slate-400 mt-1">当月累计</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <p class="text-sm text-slate-500">达标记录</p>
        <p class="text-3xl font-bold text-green-600 mt-1">{{ reportData.overall.compliantRecords }}</p>
        <p class="text-xs text-green-600 mt-1">{{ reportData.overall.compliantRecords > 0 ? ((reportData.overall.compliantRecords / reportData.overall.totalRecords) * 100).toFixed(1) : 0 }}%</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <p class="text-sm text-slate-500">异常记录</p>
        <p class="text-3xl font-bold text-red-600 mt-1">{{ reportData.overall.abnormalRecords }}</p>
        <p class="text-xs text-red-600 mt-1">{{ reportData.overall.abnormalRecords > 0 ? ((reportData.overall.abnormalRecords / reportData.overall.totalRecords) * 100).toFixed(1) : 0 }}%</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <p class="text-sm text-slate-500">总体达标率</p>
        <p class="text-3xl font-bold" :class="getComplianceColor(reportData.overall.overallComplianceRate)" mt-1>{{ reportData.overall.overallComplianceRate }}%</p>
        <p class="text-xs text-slate-400 mt-1">达标时长/总监控时长×100%</p>
      </div>
    </div>

    <div v-if="reportData" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">达标率对比</h3>
        <div class="h-72">
          <Bar v-if="barChartData" :data="barChartData" :options="barChartOptions" />
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800 mb-4">达标/异常占比</h3>
        <div class="h-72 flex items-center justify-center">
          <Doughnut v-if="doughnutChartData" :data="doughnutChartData" :options="doughnutChartOptions" />
        </div>
      </div>
    </div>

    <div v-if="reportData" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="text-lg font-semibold text-slate-800">详细数据</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">名称</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">总记录数</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">达标记录</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">异常记录</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">达标率</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">平均温度</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">达标率图示</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="item in reportData.details" :key="item.key" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ item.name }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ item.totalRecords }}</td>
              <td class="px-4 py-3 text-sm text-green-600 font-medium">{{ item.compliantRecords }}</td>
              <td class="px-4 py-3 text-sm text-red-600 font-medium">{{ item.abnormalRecords }}</td>
              <td class="px-4 py-3">
                <span class="text-sm font-semibold" :class="getComplianceColor(item.complianceRate)">
                  {{ item.complianceRate }}%
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ item.avgTemp }}°C</td>
              <td class="px-4 py-3">
                <div class="w-32 bg-slate-100 rounded-full h-2.5">
                  <div
                    class="h-2.5 rounded-full transition-all duration-500"
                    :class="getBarColor(item.complianceRate)"
                    :style="{ width: Math.min(item.complianceRate, 100) + '%' }"
                  ></div>
                </div>
              </td>
            </tr>
            <tr v-if="reportData.details.length === 0">
              <td colspan="7" class="px-4 py-12 text-center text-slate-500">暂无数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="!reportData && !loading" class="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
      <svg class="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>
      <p class="text-slate-500">请选择报表月份和统计维度，点击"生成报表"查看数据</p>
    </div>

    <div v-if="loading" class="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
      <svg class="w-8 h-8 text-blue-600 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p class="text-slate-500 mt-3">正在生成报表...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Bar, Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const { get } = useApi()

const reportData = ref<any>(null)
const locations = ref<any[]>([])
const loading = ref(false)

const now = new Date()
const reportMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
const groupBy = ref('location')
const filterLocationId = ref<number | ''>('')

const barChartData = computed(() => {
  if (!reportData.value?.details?.length) return null
  const details = reportData.value.details
  return {
    labels: details.map((d: any) => d.name),
    datasets: [{
      label: '达标率 (%)',
      data: details.map((d: any) => d.complianceRate),
      backgroundColor: details.map((d: any) => {
        if (d.complianceRate >= 98) return 'rgba(34, 197, 94, 0.7)'
        if (d.complianceRate >= 95) return 'rgba(234, 179, 8, 0.7)'
        return 'rgba(239, 68, 68, 0.7)'
      }),
      borderColor: details.map((d: any) => {
        if (d.complianceRate >= 98) return 'rgb(34, 197, 94)'
        if (d.complianceRate >= 95) return 'rgb(234, 179, 8)'
        return 'rgb(239, 68, 68)'
      }),
      borderWidth: 1
    }]
  }
})

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, max: 100, grid: { color: '#f1f5f9' } },
    x: { grid: { display: false } }
  }
}

const doughnutChartData = computed(() => {
  if (!reportData.value?.overall) return null
  const o = reportData.value.overall
  return {
    labels: ['达标', '异常'],
    datasets: [{
      data: [o.compliantRecords, o.abnormalRecords],
      backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 2
    }]
  }
})

const doughnutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const }
  }
}

const getComplianceColor = (rate: number) => {
  if (rate >= 98) return 'text-green-600'
  if (rate >= 95) return 'text-yellow-600'
  return 'text-red-600'
}

const getBarColor = (rate: number) => {
  if (rate >= 98) return 'bg-green-500'
  if (rate >= 95) return 'bg-yellow-500'
  return 'bg-red-500'
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

const fetchReport = async () => {
  loading.value = true
  try {
    const params: any = {
      reportMonth: reportMonth.value,
      groupBy: groupBy.value
    }
    if (filterLocationId.value) params.locationId = filterLocationId.value

    const result = await get('/api/reports/compliance', params)
    if (result?.success) {
      reportData.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch report:', e)
  } finally {
    loading.value = false
  }
}

const printReport = () => {
  window.print()
}

onMounted(() => {
  fetchLocations()
  fetchReport()
})
</script>
