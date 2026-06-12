<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-800">告警管理</h1>
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm">
          <span class="inline-flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-red-500"></span>
            严重: {{ stats?.critical || 0 }}
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-orange-500"></span>
            预警: {{ stats?.warning || 0 }}
          </span>
          <span class="inline-flex items-center gap-1">
            <span class="w-3 h-3 rounded-full bg-yellow-500"></span>
            一般: {{ stats?.general || 0 }}
          </span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">告警级别</label>
          <select v-model="filters.level" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部级别</option>
            <option value="critical">严重</option>
            <option value="warning">预警</option>
            <option value="general">一般</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">处理状态</label>
          <select v-model="filters.status" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="handled">处理中</option>
            <option value="resolved">已解决</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">传感器</label>
          <select v-model="filters.sensorId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option value="">全部传感器</option>
            <option v-for="sensor in sensors" :key="sensor.id" :value="sensor.id">{{ sensor.name }}</option>
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
      </div>
      <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
        <div class="flex items-center gap-3">
          <button @click="fetchAlerts" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            查询
          </button>
          <button @click="resetFilters" class="px-4 py-2 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
            重置
          </button>
        </div>
        <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
          <span class="text-sm text-slate-600">已选 {{ selectedIds.length }} 项</span>
          <button @click="batchHandle('handled')" class="px-3 py-1.5 bg-orange-100 text-orange-700 text-sm rounded-lg hover:bg-orange-200 transition-colors">
            批量标记处理中
          </button>
          <button @click="batchHandle('resolved')" class="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded-lg hover:bg-green-200 transition-colors">
            批量标记已解决
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              </th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">级别</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">标题</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">传感器</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">温度</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">阈值范围</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">创建时间</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="alert in alerts" :key="alert.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <input type="checkbox" :value="alert.id" v-model="selectedIds" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" />
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-700': alert.level === 'critical',
                    'bg-orange-100 text-orange-700': alert.level === 'warning',
                    'bg-yellow-100 text-yellow-700': alert.level === 'general'
                  }"
                >
                  <span
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-red-500': alert.level === 'critical',
                      'bg-orange-500': alert.level === 'warning',
                      'bg-yellow-500': alert.level === 'general'
                    }"
                  ></span>
                  {{ getLevelText(alert.level) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-slate-800 max-w-xs truncate" :title="alert.title">{{ alert.title }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm text-slate-600">{{ alert.sensorName }}</div>
                <div class="text-xs text-slate-400">{{ alert.sensorCode }}</div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="text-sm font-semibold"
                  :class="{
                    'text-red-600': alert.level === 'critical',
                    'text-orange-600': alert.level === 'warning',
                    'text-yellow-600': alert.level === 'general'
                  }"
                >
                  {{ alert.temperature }}°C
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-600">{{ alert.thresholdMin }}°C ~ {{ alert.thresholdMax }}°C</span>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-700': alert.status === 'pending',
                    'bg-blue-100 text-blue-700': alert.status === 'handled',
                    'bg-green-100 text-green-700': alert.status === 'resolved'
                  }"
                >
                  {{ getStatusText(alert.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="text-sm text-slate-600">{{ formatDateTime(alert.createdAt) }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="viewDetail(alert)" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    详情
                  </button>
                  <button v-if="alert.status === 'pending'" @click="handleAlert(alert, 'handled')" class="text-orange-600 hover:text-orange-800 text-sm font-medium">
                    处理
                  </button>
                  <button v-if="alert.status !== 'resolved'" @click="handleAlert(alert, 'resolved')" class="text-green-600 hover:text-green-800 text-sm font-medium">
                    解决
                  </button>
                  <button @click="createWorkOrder(alert)" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
                    工单
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && alerts.length === 0">
              <td colspan="9" class="px-4 py-12 text-center">
                <div class="flex flex-col items-center">
                  <svg class="w-12 h-12 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  <p class="text-slate-500">暂无告警数据</p>
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
          <button @click="changePage(1)" :disabled="page === 1" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            首页
          </button>
          <button @click="changePage(page - 1)" :disabled="page === 1" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            上一页
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="p in visiblePages"
              :key="p"
              @click="changePage(p)"
              class="w-9 h-9 text-sm rounded-lg transition-colors"
              :class="{
                'bg-blue-600 text-white': p === page,
                'border border-slate-300 hover:bg-slate-50': p !== page
              }"
            >
              {{ p }}
            </button>
          </div>
          <button @click="changePage(page + 1)" :disabled="page === totalPages" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            下一页
          </button>
          <button @click="changePage(totalPages)" :disabled="page === totalPages" class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
            末页
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetail" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeDetail">
      <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">告警详情</h3>
          <button @click="closeDetail" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div v-if="selectedAlert" class="p-6 space-y-6">
          <div class="flex items-start gap-4">
            <div
              class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="{
                'bg-red-100': selectedAlert.level === 'critical',
                'bg-orange-100': selectedAlert.level === 'warning',
                'bg-yellow-100': selectedAlert.level === 'general'
              }"
            >
              <svg
                class="w-6 h-6"
                :class="{
                  'text-red-600': selectedAlert.level === 'critical',
                  'text-orange-600': selectedAlert.level === 'warning',
                  'text-yellow-600': selectedAlert.level === 'general'
                }"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h4 class="text-xl font-semibold text-slate-800">{{ selectedAlert.title }}</h4>
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-red-100 text-red-700': selectedAlert.level === 'critical',
                    'bg-orange-100 text-orange-700': selectedAlert.level === 'warning',
                    'bg-yellow-100 text-yellow-700': selectedAlert.level === 'general'
                  }"
                >
                  {{ getLevelText(selectedAlert.level) }}
                </span>
              </div>
              <p class="text-sm text-slate-500">告警ID: {{ selectedAlert.id }} · {{ formatDateTime(selectedAlert.createdAt) }}</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">传感器</p>
              <p class="text-sm font-medium text-slate-800">{{ selectedAlert.sensorName }}</p>
              <p class="text-xs text-slate-400">{{ selectedAlert.sensorCode }}</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">当前温度</p>
              <p
                class="text-lg font-bold"
                :class="{
                  'text-red-600': selectedAlert.level === 'critical',
                  'text-orange-600': selectedAlert.level === 'warning',
                  'text-yellow-600': selectedAlert.level === 'general'
                }"
              >
                {{ selectedAlert.temperature }}°C
              </p>
            </div>
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">阈值范围</p>
              <p class="text-sm font-medium text-slate-800">{{ selectedAlert.thresholdMin }}°C ~ {{ selectedAlert.thresholdMax }}°C</p>
            </div>
            <div class="bg-slate-50 rounded-lg p-4">
              <p class="text-xs text-slate-500 mb-1">处理状态</p>
              <span
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                :class="{
                  'bg-red-100 text-red-700': selectedAlert.status === 'pending',
                  'bg-blue-100 text-blue-700': selectedAlert.status === 'handled',
                  'bg-green-100 text-green-700': selectedAlert.status === 'resolved'
                }"
              >
                {{ getStatusText(selectedAlert.status) }}
              </span>
            </div>
          </div>

          <div v-if="selectedAlert.content" class="bg-slate-50 rounded-lg p-4">
            <p class="text-xs text-slate-500 mb-2">告警详情</p>
            <p class="text-sm text-slate-700">{{ selectedAlert.content }}</p>
          </div>

          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-xs text-slate-500 mb-1">创建人</p>
              <p class="text-slate-800">{{ selectedAlert.createdByName || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-1">处理时间</p>
              <p class="text-slate-800">{{ selectedAlert.handledAt ? formatDateTime(selectedAlert.handledAt) : '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 mb-1">解决时间</p>
              <p class="text-slate-800">{{ selectedAlert.resolvedAt ? formatDateTime(selectedAlert.resolvedAt) : '-' }}</p>
            </div>
          </div>

          <div v-if="selectedAlert.workOrders && selectedAlert.workOrders.length > 0" class="border-t border-slate-200 pt-4">
            <p class="text-sm font-medium text-slate-700 mb-3">关联工单</p>
            <div class="space-y-2">
              <div v-for="wo in selectedAlert.workOrders" :key="wo.id" class="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div>
                  <p class="text-sm font-medium text-slate-800">{{ wo.code }} - {{ wo.title }}</p>
                  <p class="text-xs text-slate-500">状态: {{ wo.status }} · 指派人: {{ wo.assignee?.realName || wo.assignee?.username || '未指派' }}</p>
                </div>
                <span
                  class="text-xs px-2 py-1 rounded-full"
                  :class="{
                    'bg-yellow-100 text-yellow-700': wo.status === 'PENDING',
                    'bg-blue-100 text-blue-700': wo.status === 'ASSIGNED',
                    'bg-purple-100 text-purple-700': wo.status === 'PROCESSING',
                    'bg-green-100 text-green-700': wo.status === 'COMPLETED',
                    'bg-slate-100 text-slate-700': wo.status === 'CLOSED'
                  }"
                >
                  {{ wo.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button @click="closeDetail" class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              关闭
            </button>
            <button v-if="selectedAlert.status === 'pending'" @click="handleAlert(selectedAlert, 'handled')" class="px-4 py-2 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors">
              标记处理中
            </button>
            <button v-if="selectedAlert.status !== 'resolved'" @click="handleAlert(selectedAlert, 'resolved')" class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
              标记已解决
            </button>
            <button @click="openWorkOrderDialog(selectedAlert)" class="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
              创建工单
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showWorkOrderDialog" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="closeWorkOrderDialog">
      <div class="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">创建工单</h3>
          <button @click="closeWorkOrderDialog" class="text-slate-400 hover:text-slate-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div v-if="selectedAlert" class="bg-slate-50 rounded-lg p-4">
            <p class="text-sm font-medium text-slate-700 mb-2">关联告警</p>
            <div class="flex items-center gap-2">
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-red-500': selectedAlert.level === 'critical',
                  'bg-orange-500': selectedAlert.level === 'warning',
                  'bg-yellow-500': selectedAlert.level === 'general'
                }"
              ></span>
              <span class="text-sm text-slate-600">{{ selectedAlert.title }}</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">优先级</label>
            <select v-model="workOrderForm.priority" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="LOW">低</option>
              <option value="MEDIUM">中</option>
              <option value="HIGH">高</option>
              <option value="URGENT">紧急</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">指派人</label>
            <select v-model="workOrderForm.assigneeId" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option value="">未指派</option>
              <option v-for="user in users" :key="user.id" :value="user.id">{{ user.realName || user.username }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
            <input type="datetime-local" v-model="workOrderForm.dueDate" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">描述</label>
            <textarea v-model="workOrderForm.description" rows="3" class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" placeholder="请输入工单描述..."></textarea>
          </div>
        </div>

        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button @click="closeWorkOrderDialog" class="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
            取消
          </button>
          <button @click="submitWorkOrder" :disabled="submitting" class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ submitting ? '创建中...' : '创建工单' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { get, put, post } = useApi()

const alerts = ref<any[]>([])
const sensors = ref<any[]>([])
const users = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)
const stats = ref<any>({ critical: 0, warning: 0, general: 0 })

const filters = ref({
  level: '',
  status: '',
  sensorId: '',
  startTime: '',
  endTime: ''
})

const selectedIds = ref<number[]>([])
const selectAll = ref(false)
const showDetail = ref(false)
const selectedAlert = ref<any>(null)
const showWorkOrderDialog = ref(false)
const submitting = ref(false)

const workOrderForm = ref({
  priority: 'HIGH',
  assigneeId: '',
  dueDate: '',
  description: ''
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = page.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i)
    pages.push(total)
  } else if (current >= total - 3) {
    pages.push(1)
    for (let i = total - 4; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push(total)
  }
  
  return pages
})

const getLevelText = (level: string) => {
  const map: Record<string, string> = {
    critical: '严重',
    warning: '预警',
    general: '一般'
  }
  return map[level] || level
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    handled: '处理中',
    resolved: '已解决'
  }
  return map[status] || status
}

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchAlerts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filters.value.level) params.level = filters.value.level
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.sensorId) params.sensorId = filters.value.sensorId
    if (filters.value.startTime) params.startTime = filters.value.startTime
    if (filters.value.endTime) params.endTime = filters.value.endTime

    const result = await get('/api/alerts', params)
    if (result?.success) {
      alerts.value = result.data
      total.value = result.total
      totalPages.value = result.totalPages
    }
  } catch (e) {
    console.error('Failed to fetch alerts:', e)
  } finally {
    loading.value = false
  }
}

const fetchSensors = async () => {
  try {
    const result = await get('/api/sensors', { pageSize: 100 })
    if (result?.success) {
      sensors.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch sensors:', e)
  }
}

const fetchUsers = async () => {
  try {
    const result = await get('/api/users', { status: 'active' })
    if (result?.success) {
      users.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch users:', e)
  }
}

const fetchStats = async () => {
  try {
    const [pending, handled, resolved] = await Promise.all([
      get('/api/alerts', { status: 'pending', pageSize: 1 }),
      get('/api/alerts', { status: 'handled', pageSize: 1 }),
      get('/api/alerts', { status: 'resolved', pageSize: 1 })
    ])
    
    const countByLevel = async (level: string) => {
      const result = await get('/api/alerts', { level, status: 'pending', pageSize: 1 })
      return result?.total || 0
    }
    
    const [critical, warning, general] = await Promise.all([
      countByLevel('critical'),
      countByLevel('warning'),
      countByLevel('general')
    ])
    
    stats.value = { critical, warning, general }
  } catch (e) {
    console.error('Failed to fetch stats:', e)
  }
}

const resetFilters = () => {
  filters.value = {
    level: '',
    status: '',
    sensorId: '',
    startTime: '',
    endTime: ''
  }
  page.value = 1
  fetchAlerts()
}

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchAlerts()
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedIds.value = alerts.value.map(a => a.id)
  } else {
    selectedIds.value = []
  }
}

const viewDetail = async (alert: any) => {
  try {
    const result = await get(`/api/alerts/${alert.id}`)
    if (result?.success) {
      selectedAlert.value = result.data
      showDetail.value = true
    }
  } catch (e) {
    console.error('Failed to fetch alert detail:', e)
  }
}

const closeDetail = () => {
  showDetail.value = false
  selectedAlert.value = null
}

const handleAlert = async (alert: any, status: string) => {
  try {
    const result = await put(`/api/alerts/${alert.id}`, { status })
    if (result?.success) {
      fetchAlerts()
      fetchStats()
      if (selectedAlert.value?.id === alert.id) {
        selectedAlert.value.status = status
        if (status === 'handled') {
          selectedAlert.value.handledAt = new Date().toISOString()
        } else if (status === 'resolved') {
          selectedAlert.value.resolvedAt = new Date().toISOString()
        }
      }
    }
  } catch (e) {
    console.error('Failed to update alert:', e)
  }
}

const batchHandle = async (status: string) => {
  if (selectedIds.value.length === 0) return
  try {
    const result = await put('/api/alerts/batch', { ids: selectedIds.value, status })
    if (result?.success) {
      fetchAlerts()
      fetchStats()
      selectedIds.value = []
      selectAll.value = false
    }
  } catch (e) {
    console.error('Failed to batch update alerts:', e)
  }
}

const createWorkOrder = (alert: any) => {
  selectedAlert.value = alert
  openWorkOrderDialog(alert)
}

const openWorkOrderDialog = (alert: any) => {
  selectedAlert.value = alert
  workOrderForm.value = {
    priority: alert.level === 'critical' ? 'URGENT' : alert.level === 'warning' ? 'HIGH' : 'MEDIUM',
    assigneeId: '',
    dueDate: '',
    description: ''
  }
  showWorkOrderDialog.value = true
}

const closeWorkOrderDialog = () => {
  showWorkOrderDialog.value = false
  workOrderForm.value = {
    priority: 'HIGH',
    assigneeId: '',
    dueDate: '',
    description: ''
  }
}

const submitWorkOrder = async () => {
  if (!selectedAlert.value) return
  
  submitting.value = true
  try {
    const result = await post(`/api/alerts/${selectedAlert.value.id}/workorder`, {
      priority: workOrderForm.value.priority,
      assigneeId: workOrderForm.value.assigneeId || undefined,
      dueDate: workOrderForm.value.dueDate || undefined,
      description: workOrderForm.value.description || undefined
    })
    
    if (result?.success) {
      closeWorkOrderDialog()
      closeDetail()
      fetchAlerts()
    }
  } catch (e) {
    console.error('Failed to create work order:', e)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchAlerts()
  fetchSensors()
  fetchUsers()
  fetchStats()
})
</script>
