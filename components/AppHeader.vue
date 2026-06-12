<template>
  <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
    <div class="flex items-center gap-4">
      <div class="text-lg font-semibold text-slate-800">{{ currentPageTitle }}</div>
      <div v-if="unreadAlerts > 0" class="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        {{ unreadAlerts }} 条告警
      </div>
    </div>
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 text-sm text-slate-500">
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span>实时监控中</span>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right">
          <div class="text-sm font-medium text-slate-700">{{ user?.realName || user?.username }}</div>
          <div class="text-xs text-slate-500">{{ user?.roleName }}</div>
        </div>
        <div class="relative">
          <button @click="showUserMenu = !showUserMenu" class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium hover:bg-blue-700 transition-colors">
            {{ (user?.realName || user?.username || 'U').charAt(0).toUpperCase() }}
          </button>
          <div v-if="showUserMenu" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
            <div class="px-4 py-2 border-b border-slate-100">
              <div class="text-sm font-medium text-slate-700">{{ user?.realName || user?.username }}</div>
              <div class="text-xs text-slate-500">{{ user?.email }}</div>
            </div>
            <button @click="handleLogout" class="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { user, logout } = useAuth()
const { get } = useApi()

const showUserMenu = ref(false)
const unreadAlerts = ref(0)
let alertPollingInterval: ReturnType<typeof setInterval> | null = null

const currentPageTitle = computed(() => {
  const path = route.path
  if (path.startsWith('/dashboard')) return '仪表盘'
  if (path.startsWith('/sensors')) return '传感器监控'
  if (path.startsWith('/alerts')) return '告警管理'
  if (path.startsWith('/workorders')) return '工单管理'
  if (path.startsWith('/history')) return '历史数据'
  if (path.startsWith('/reports')) return '达标率报表'
  return '冷链监控平台'
})

const fetchUnreadAlerts = async () => {
  try {
    const result = await get('/api/alerts', { status: 'pending', pageSize: 1 })
    if (result?.success) {
      unreadAlerts.value = result.total || 0
    }
  } catch (e) {
    console.error('Failed to fetch unread alerts:', e)
  }
}

const handleLogout = () => {
  showUserMenu.value = false
  logout()
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  fetchUnreadAlerts()
  alertPollingInterval = setInterval(fetchUnreadAlerts, 30000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (alertPollingInterval) {
    clearInterval(alertPollingInterval)
  }
  document.removeEventListener('click', handleClickOutside)
})
</script>
