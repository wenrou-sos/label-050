<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold text-slate-800">传感器监控</h2>
          <p class="text-sm text-slate-500 mt-1">管理和监控所有温度传感器</p>
        </div>
        <div class="flex flex-wrap gap-3">
          <button
            @click="openCreateDialog"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            新增传感器
          </button>
          <button
            @click="fetchSensors"
            class="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            刷新
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">位置</label>
          <select
            v-model="filters.locationId"
            @change="fetchSensors"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">全部位置</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
          <select
            v-model="filters.status"
            @change="fetchSensors"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">全部状态</option>
            <option value="online">在线</option>
            <option value="offline">离线</option>
            <option value="abnormal">异常</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1.5">关键词搜索</label>
          <div class="relative">
            <input
              v-model="filters.keyword"
              @keyup.enter="fetchSensors"
              type="text"
              placeholder="搜索名称或编号..."
              class="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
        <div class="flex items-end">
          <button
            @click="resetFilters"
            class="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            重置筛选
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">名称</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">编号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">位置</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">货物类型</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">当前温度</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">预警范围</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">最后更新</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="sensor in sensors" :key="sensor.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center" :class="getStatusIconBg(sensor.status)">
                    <svg class="w-4 h-4" :class="getStatusIconColor(sensor.status)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <span class="font-medium text-slate-800 text-sm">{{ sensor.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600 font-mono">{{ sensor.code }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ sensor.locationName }}</td>
              <td class="px-4 py-3 text-sm text-slate-600">{{ sensor.goodsType || '-' }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span
                    class="text-sm font-semibold"
                    :class="getTempColor(sensor)"
                  >
                    {{ sensor.currentTemp !== undefined && sensor.currentTemp !== null ? sensor.currentTemp.toFixed(1) : '--' }}°C
                  </span>
                  <span v-if="sensor.status === 'online'" class="w-2 h-2 rounded-full" :class="getTempDotColor(sensor)"></span>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="getStatusClass(sensor.status)"
                >
                  <span class="w-1.5 h-1.5 rounded-full" :class="getStatusDotClass(sensor.status)"></span>
                  {{ getStatusText(sensor.status) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-slate-600">
                {{ sensor.warningMin }}°C ~ {{ sensor.warningMax }}°C
              </td>
              <td class="px-4 py-3 text-sm text-slate-500">
                {{ formatTime(sensor.lastUpdate) }}
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex items-center justify-end gap-2">
                  <button
                    @click="openEditDialog(sensor)"
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(sensor)"
                    class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="9" class="px-4 py-12 text-center">
                <div class="inline-flex items-center gap-2 text-slate-500">
                  <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>加载中...</span>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && sensors.length === 0">
              <td colspan="9" class="px-4 py-12 text-center">
                <div class="text-slate-500">
                  <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  <p>暂无传感器数据</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="px-5 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-sm text-slate-600">
          共 <span class="font-semibold text-slate-800">{{ total }}</span> 条，第 <span class="font-semibold text-slate-800">{{ page }}</span> / <span class="font-semibold text-slate-800">{{ totalPages }}</span> 页
        </div>
        <div class="flex items-center gap-1">
          <button
            @click="changePage(1)"
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            首页
          </button>
          <button
            @click="changePage(page - 1)"
            :disabled="page === 1"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <div v-for="p in visiblePages" :key="p" class="flex">
            <button
              @click="changePage(p)"
              class="px-3 py-1.5 text-sm rounded-lg transition-colors"
              :class="page === p ? 'bg-blue-600 text-white' : 'border border-slate-300 hover:bg-slate-50'"
            >
              {{ p }}
            </button>
          </div>
          <button
            @click="changePage(page + 1)"
            :disabled="page === totalPages"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
          <button
            @click="changePage(totalPages)"
            :disabled="page === totalPages"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            末页
          </button>
        </div>
      </div>
    </div>

    <div v-if="dialogVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">
            {{ editingSensor ? '编辑传感器' : '新增传感器' }}
          </h3>
          <button @click="dialogVisible = false" class="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">传感器名称 <span class="text-red-500">*</span></label>
              <input
                v-model="formData.name"
                type="text"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="请输入传感器名称"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">传感器编号 <span class="text-red-500">*</span></label>
              <input
                v-model="formData.code"
                type="text"
                :disabled="!!editingSensor"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="请输入传感器编号"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">位置 <span class="text-red-500">*</span></label>
              <select
                v-model="formData.locationId"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">请选择位置</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">关联货物</label>
              <select
                v-model="formData.goodsId"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">请选择货物</option>
                <option v-for="good in goodsList" :key="good.id" :value="good.id">{{ good.name }}</option>
              </select>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">型号</label>
              <input
                v-model="formData.model"
                type="text"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="请输入型号"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">制造商</label>
              <input
                v-model="formData.manufacturer"
                type="text"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="请输入制造商"
              />
            </div>
          </div>
          <div class="border-t border-slate-200 pt-4">
            <h4 class="text-sm font-semibold text-slate-700 mb-3">温度阈值设置</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">最低温度 (°C)</label>
                <input
                  v-model.number="formData.minTemp"
                  type="number"
                  step="0.1"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">最高温度 (°C)</label>
                <input
                  v-model.number="formData.maxTemp"
                  type="number"
                  step="0.1"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">预警下限 (°C)</label>
                <input
                  v-model.number="formData.warningMin"
                  type="number"
                  step="0.1"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">预警上限 (°C)</label>
                <input
                  v-model.number="formData.warningMax"
                  type="number"
                  step="0.1"
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
            <select
              v-model="formData.status"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="online">在线</option>
              <option value="offline">离线</option>
              <option value="abnormal">异常</option>
            </select>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="dialogVisible = false"
            class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            @click="submitForm"
            :disabled="submitting"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium inline-flex items-center gap-2"
          >
            <svg v-if="submitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ editingSensor ? '保存修改' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleteDialogVisible" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="px-6 py-4 border-b border-slate-200">
          <h3 class="text-lg font-semibold text-slate-800">确认删除</h3>
        </div>
        <div class="px-6 py-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm text-slate-600">
                确定要删除传感器 <span class="font-semibold text-slate-800">{{ deletingSensor?.name }}</span> 吗？
              </p>
              <p class="text-xs text-slate-500 mt-1">此操作不可撤销。</p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="deleteDialogVisible = false"
            class="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
          >
            取消
          </button>
          <button
            @click="deleteSensor"
            :disabled="deleting"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium inline-flex items-center gap-2"
          >
            <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            确认删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const { get, post, put, del } = useApi()

const sensors = ref<any[]>([])
const locations = ref<any[]>([])
const goodsList = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const deleting = ref(false)

const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)

const filters = ref({
  locationId: '' as number | string,
  status: '' as string,
  keyword: '' as string
})

const dialogVisible = ref(false)
const editingSensor = ref<any>(null)
const formData = ref({
  name: '',
  code: '',
  locationId: '',
  goodsId: '',
  model: '',
  manufacturer: '',
  minTemp: -30,
  maxTemp: 10,
  warningMin: -25,
  warningMax: 4,
  status: 'online'
})

const deleteDialogVisible = ref(false)
const deletingSensor = ref<any>(null)

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = page.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 3) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }
  
  return pages
})

const fetchSensors = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    if (filters.value.locationId) params.locationId = filters.value.locationId
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.keyword) params.keyword = filters.value.keyword
    
    const result = await get('/api/sensors', params)
    if (result?.success) {
      sensors.value = result.data
      total.value = result.total
      totalPages.value = result.totalPages
    }
  } catch (e) {
    console.error('Failed to fetch sensors:', e)
  } finally {
    loading.value = false
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

const fetchGoods = async () => {
  try {
    const result = await get('/api/goods', { status: 'active' })
    if (result?.success) {
      goodsList.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch goods:', e)
  }
}

const changePage = (newPage: number) => {
  if (newPage >= 1 && newPage <= totalPages.value) {
    page.value = newPage
    fetchSensors()
  }
}

const resetFilters = () => {
  filters.value = {
    locationId: '',
    status: '',
    keyword: ''
  }
  page.value = 1
  fetchSensors()
}

const openCreateDialog = () => {
  editingSensor.value = null
  formData.value = {
    name: '',
    code: '',
    locationId: '',
    goodsId: '',
    model: '',
    manufacturer: '',
    minTemp: -30,
    maxTemp: 10,
    warningMin: -25,
    warningMax: 4,
    status: 'online'
  }
  dialogVisible.value = true
}

const openEditDialog = (sensor: any) => {
  editingSensor.value = sensor
  formData.value = {
    name: sensor.name,
    code: sensor.code,
    locationId: sensor.locationId,
    goodsId: sensor.goodsId || '',
    model: sensor.model || '',
    manufacturer: sensor.manufacturer || '',
    minTemp: sensor.minTemp,
    maxTemp: sensor.maxTemp,
    warningMin: sensor.warningMin,
    warningMax: sensor.warningMax,
    status: sensor.status
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formData.value.name || !formData.value.code || !formData.value.locationId) {
    alert('请填写必填项')
    return
  }

  submitting.value = true
  try {
    const body: any = {
      ...formData.value,
      locationId: formData.value.locationId ? Number(formData.value.locationId) : undefined,
      goodsId: formData.value.goodsId ? Number(formData.value.goodsId) : null
    }

    let result
    if (editingSensor.value) {
      result = await put(`/api/sensors/${editingSensor.value.id}`, body)
    } else {
      result = await post('/api/sensors', body)
    }

    if (result?.success) {
      dialogVisible.value = false
      fetchSensors()
    } else {
      alert(result?.message || '操作失败')
    }
  } catch (e: any) {
    alert(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (sensor: any) => {
  deletingSensor.value = sensor
  deleteDialogVisible.value = true
}

const deleteSensor = async () => {
  if (!deletingSensor.value) return

  deleting.value = true
  try {
    const result = await del(`/api/sensors/${deletingSensor.value.id}`)
    if (result?.success) {
      deleteDialogVisible.value = false
      deletingSensor.value = null
      fetchSensors()
    } else {
      alert(result?.message || '删除失败')
    }
  } catch (e: any) {
    alert(e.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-100 text-green-700'
    case 'offline':
      return 'bg-slate-100 text-slate-600'
    case 'abnormal':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const getStatusDotClass = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'offline':
      return 'bg-slate-400'
    case 'abnormal':
      return 'bg-red-500'
    default:
      return 'bg-slate-400'
  }
}

const getStatusIconBg = (status: string) => {
  switch (status) {
    case 'online':
      return 'bg-green-100'
    case 'offline':
      return 'bg-slate-100'
    case 'abnormal':
      return 'bg-red-100'
    default:
      return 'bg-slate-100'
  }
}

const getStatusIconColor = (status: string) => {
  switch (status) {
    case 'online':
      return 'text-green-600'
    case 'offline':
      return 'text-slate-500'
    case 'abnormal':
      return 'text-red-600'
    default:
      return 'text-slate-500'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'online':
      return '正常'
    case 'offline':
      return '离线'
    case 'abnormal':
      return '异常'
    default:
      return '未知'
  }
}

const getTempColor = (sensor: any) => {
  if (sensor.status === 'offline') return 'text-slate-400'
  if (sensor.currentTemp === undefined || sensor.currentTemp === null) return 'text-slate-400'
  if (sensor.currentTemp < sensor.warningMin || sensor.currentTemp > sensor.warningMax) {
    return 'text-red-600'
  }
  return 'text-green-600'
}

const getTempDotColor = (sensor: any) => {
  if (sensor.currentTemp === undefined || sensor.currentTemp === null) return 'bg-slate-300'
  if (sensor.currentTemp < sensor.warningMin || sensor.currentTemp > sensor.warningMax) {
    return 'bg-red-500 animate-pulse'
  }
  return 'bg-green-500'
}

const formatTime = (dateStr: string | undefined) => {
  if (!dateStr) return '--'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  fetchSensors()
  fetchLocations()
  fetchGoods()
})
</script>
