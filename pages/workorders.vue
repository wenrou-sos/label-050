<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-slate-800">工单管理</h2>
      <button
        @click="openCreateDialog"
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
        </svg>
        新建工单
      </button>
    </div>

    <div class="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">状态</label>
          <select
            v-model="filters.status"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            <option value="">全部状态</option>
            <option value="PENDING">待分配</option>
            <option value="ASSIGNED">已分配</option>
            <option value="PROCESSING">处理中</option>
            <option value="COMPLETED">已完成</option>
            <option value="CLOSED">已关闭</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">优先级</label>
          <select
            v-model="filters.priority"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            <option value="">全部优先级</option>
            <option value="LOW">低</option>
            <option value="MEDIUM">中</option>
            <option value="HIGH">高</option>
            <option value="URGENT">紧急</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">负责人</label>
          <select
            v-model="filters.assigneeId"
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          >
            <option :value="undefined">全部负责人</option>
            <option v-for="user in users" :key="user.id" :value="user.id">
              {{ user.realName || user.username }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">关键词搜索</label>
          <input
            v-model="filters.keyword"
            type="text"
            placeholder="输入工单编号、标题..."
            class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
        </div>
        <div class="flex items-end gap-2">
          <button
            @click="fetchWorkOrders"
            class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            搜索
          </button>
          <button
            @click="resetFilters"
            class="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
          >
            重置
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">工单编号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">标题</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">优先级</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">状态</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">负责人</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">创建人</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">截止日期</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">创建时间</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="wo in workOrders" :key="wo.id" class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3">
                <span class="text-sm font-mono text-blue-600">{{ wo.code }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="max-w-xs">
                  <p class="text-sm font-medium text-slate-800 truncate">{{ wo.title }}</p>
                  <p v-if="wo.alertTitle" class="text-xs text-slate-500 truncate mt-0.5">
                    关联告警: {{ wo.alertTitle }}
                  </p>
                </div>
              </td>
              <td class="px-4 py-3">
                <span :class="getPriorityClass(wo.priority)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                  {{ getPriorityText(wo.priority) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="getStatusClass(wo.status)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                  {{ getStatusText(wo.status) }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-600">{{ wo.assigneeName || '-' }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-600">{{ wo.creatorName || '-' }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm" :class="isOverdue(wo) ? 'text-red-600 font-medium' : 'text-slate-600'">
                  {{ wo.dueDate ? formatDate(wo.dueDate) : '-' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="text-sm text-slate-600">{{ formatDateTime(wo.createdAt) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-1">
                  <button
                    @click="viewDetail(wo)"
                    class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="查看详情"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="wo.status === 'PENDING' || wo.status === 'ASSIGNED'"
                    @click="openAssignDialog(wo)"
                    class="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                    title="分配工单"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="wo.status === 'ASSIGNED' || wo.status === 'PENDING'"
                    @click="startWorkOrder(wo)"
                    class="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="开始处理"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="wo.status === 'PROCESSING'"
                    @click="openCompleteDialog(wo)"
                    class="p-1.5 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="完成工单"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </button>
                  <button
                    v-if="wo.status !== 'CLOSED'"
                    @click="openStatusDialog(wo)"
                    class="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="更新状态"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!workOrders.length && !loading">
              <td colspan="9" class="px-4 py-12 text-center text-slate-500">
                <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p>暂无工单数据</p>
              </td>
            </tr>
            <tr v-if="loading">
              <td colspan="9" class="px-4 py-12 text-center text-slate-500">
                <div class="inline-flex items-center gap-2">
                  <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  <span>加载中...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <div class="text-sm text-slate-600">
          共 <span class="font-medium">{{ total }}</span> 条记录，第 <span class="font-medium">{{ page }}</span> / <span class="font-medium">{{ totalPages }}</span> 页
        </div>
        <div class="flex items-center gap-2">
          <button
            @click="changePage(page - 1)"
            :disabled="page <= 1 || loading"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            上一页
          </button>
          <div class="flex items-center gap-1">
            <button
              v-for="p in visiblePages"
              :key="p"
              @click="changePage(p)"
              :disabled="loading"
              :class="p === page ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'"
              class="w-8 h-8 text-sm border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
            >
              {{ p }}
            </button>
          </div>
          <button
            @click="changePage(page + 1)"
            :disabled="page >= totalPages || loading"
            class="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeCreateDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">新建工单</h3>
          <button @click="closeCreateDialog" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4 space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">工单标题 <span class="text-red-500">*</span></label>
            <input
              v-model="createForm.title"
              type="text"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              placeholder="请输入工单标题"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">工单描述</label>
            <textarea
              v-model="createForm.description"
              rows="3"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="请输入工单描述"
            ></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">优先级</label>
              <select
                v-model="createForm.priority"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option value="LOW">低</option>
                <option value="MEDIUM">中</option>
                <option value="HIGH">高</option>
                <option value="URGENT">紧急</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">负责人</label>
              <select
                v-model="createForm.assigneeId"
                class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              >
                <option :value="undefined">暂不分配</option>
                <option v-for="user in users" :key="user.id" :value="user.id">
                  {{ user.realName || user.username }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
            <input
              v-model="createForm.dueDate"
              type="date"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="closeCreateDialog"
            class="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="createWorkOrder"
            :disabled="createLoading || !createForm.title"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <svg v-if="createLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            创建工单
          </button>
        </div>
      </div>
    </div>

    <div v-if="showAssignDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeAssignDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">分配工单</h3>
          <button @click="closeAssignDialog" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="text-sm font-medium text-slate-800">{{ selectedWorkOrder?.title }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ selectedWorkOrder?.code }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">选择负责人 <span class="text-red-500">*</span></label>
            <select
              v-model="assignForm.assigneeId"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option :value="undefined">请选择负责人</option>
              <option v-for="user in users" :key="user.id" :value="user.id">
                {{ user.realName || user.username }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">分配说明</label>
            <textarea
              v-model="assignForm.content"
              rows="2"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="请输入分配说明（可选）"
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="closeAssignDialog"
            class="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="assignWorkOrder"
            :disabled="assignLoading || !assignForm.assigneeId"
            class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <svg v-if="assignLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            确认分配
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompleteDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeCompleteDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">完成工单</h3>
          <button @click="closeCompleteDialog" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="text-sm font-medium text-slate-800">{{ selectedWorkOrder?.title }}</p>
            <p class="text-xs text-slate-500 mt-1">{{ selectedWorkOrder?.code }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">处理结果 <span class="text-red-500">*</span></label>
            <textarea
              v-model="completeForm.content"
              rows="4"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="请输入处理结果说明"
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="closeCompleteDialog"
            class="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="completeWorkOrder"
            :disabled="completeLoading || !completeForm.content.trim()"
            class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <svg v-if="completeLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            确认完成
          </button>
        </div>
      </div>
    </div>

    <div v-if="showStatusDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeStatusDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">更新状态</h3>
          <button @click="closeStatusDialog" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="px-6 py-4 space-y-4">
          <div class="p-3 bg-slate-50 rounded-lg">
            <p class="text-sm font-medium text-slate-800">{{ selectedWorkOrder?.title }}</p>
            <p class="text-xs text-slate-500 mt-1">当前状态: {{ getStatusText(selectedWorkOrder?.status || '') }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">操作类型</label>
            <select
              v-model="statusForm.action"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            >
              <option value="update">更新说明</option>
              <option value="close">关闭工单</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">处理说明 <span class="text-red-500">*</span></label>
            <textarea
              v-model="statusForm.content"
              rows="3"
              class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
              placeholder="请输入处理说明"
            ></textarea>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            @click="closeStatusDialog"
            class="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            @click="updateWorkOrderStatus"
            :disabled="statusLoading || !statusForm.content.trim()"
            class="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            <svg v-if="statusLoading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            确认更新
          </button>
        </div>
      </div>
    </div>

    <div v-if="showDetailDialog" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/50" @click="closeDetailDialog"></div>
      <div class="relative bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div class="px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-semibold text-slate-800">工单详情</h3>
            <span :class="getStatusClass(workOrderDetail?.status || '')" class="text-xs px-2.5 py-1 rounded-full font-medium">
              {{ getStatusText(workOrderDetail?.status || '') }}
            </span>
          </div>
          <button @click="closeDetailDialog" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="workOrderDetail" class="p-6 space-y-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">工单编号</label>
                <p class="text-sm font-mono text-blue-600 mt-1">{{ workOrderDetail.code }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">优先级</label>
                <p class="mt-1">
                  <span :class="getPriorityClass(workOrderDetail.priority)" class="text-xs px-2.5 py-1 rounded-full font-medium">
                    {{ getPriorityText(workOrderDetail.priority) }}
                  </span>
                </p>
              </div>
              <div class="col-span-2">
                <label class="text-xs text-slate-500 uppercase tracking-wider">工单标题</label>
                <p class="text-base font-medium text-slate-800 mt-1">{{ workOrderDetail.title }}</p>
              </div>
              <div class="col-span-2" v-if="workOrderDetail.description">
                <label class="text-xs text-slate-500 uppercase tracking-wider">工单描述</label>
                <p class="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{{ workOrderDetail.description }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">负责人</label>
                <p class="text-sm text-slate-800 mt-1">{{ workOrderDetail.assignee?.realName || workOrderDetail.assignee?.username || '-' }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">创建人</label>
                <p class="text-sm text-slate-800 mt-1">{{ workOrderDetail.creator?.realName || workOrderDetail.creator?.username || '-' }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">创建时间</label>
                <p class="text-sm text-slate-800 mt-1">{{ formatDateTime(workOrderDetail.createdAt) }}</p>
              </div>
              <div>
                <label class="text-xs text-slate-500 uppercase tracking-wider">截止日期</label>
                <p class="text-sm mt-1" :class="isOverdue(workOrderDetail) ? 'text-red-600 font-medium' : 'text-slate-800'">
                  {{ workOrderDetail.dueDate ? formatDate(workOrderDetail.dueDate) : '-' }}
                </p>
              </div>
            </div>

            <div v-if="workOrderDetail.alert" class="p-4 bg-red-50 rounded-lg border border-red-100">
              <h4 class="text-sm font-semibold text-red-800 mb-2">关联告警</h4>
              <div class="space-y-1 text-sm">
                <p><span class="text-red-600">告警标题:</span> {{ workOrderDetail.alert.title }}</p>
                <p><span class="text-red-600">告警级别:</span> {{ workOrderDetail.alert.level }}</p>
                <p><span class="text-red-600">传感器:</span> {{ workOrderDetail.alert.sensor.name }}</p>
                <p><span class="text-red-600">告警温度:</span> {{ workOrderDetail.alert.temperature }}°C</p>
                <p v-if="workOrderDetail.alert.content"><span class="text-red-600">告警内容:</span> {{ workOrderDetail.alert.content }}</p>
              </div>
            </div>

            <div>
              <h4 class="text-sm font-semibold text-slate-800 mb-4">处理记录</h4>
              <div class="relative pl-6 space-y-4">
                <div class="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200"></div>
                <div
                  v-for="record in workOrderDetail.records"
                  :key="record.id"
                  class="relative"
                >
                  <div class="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                  <div class="bg-slate-50 rounded-lg p-3">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-sm font-medium text-slate-800">
                        {{ record.user?.realName || record.user?.username }}
                      </span>
                      <span class="text-xs text-slate-500">{{ formatDateTime(record.createdAt) }}</span>
                    </div>
                    <span :class="getActionClass(record.action)" class="text-xs px-2 py-0.5 rounded-full">
                      {{ getActionText(record.action) }}
                    </span>
                    <p class="text-sm text-slate-600 mt-2">{{ record.content }}</p>
                  </div>
                </div>
                <div v-if="!workOrderDetail.records.length" class="text-center py-8 text-slate-500 text-sm">
                  暂无处理记录
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-12 text-center text-slate-500">
            <svg class="w-8 h-8 mx-auto mb-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <p>加载中...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { WorkOrder, WorkOrderDetail, WorkOrderPriority, WorkOrderStatus, User, CreateWorkOrderRequest } from '~/types'

const { get, post, put } = useApi()

const workOrders = ref<WorkOrder[]>([])
const users = ref<User[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(0)

const filters = ref({
  status: '' as WorkOrderStatus | '',
  priority: '' as WorkOrderPriority | '',
  assigneeId: undefined as number | undefined,
  keyword: ''
})

const showCreateDialog = ref(false)
const showAssignDialog = ref(false)
const showCompleteDialog = ref(false)
const showStatusDialog = ref(false)
const showDetailDialog = ref(false)

const selectedWorkOrder = ref<WorkOrder | null>(null)
const workOrderDetail = ref<WorkOrderDetail | null>(null)

const createLoading = ref(false)
const assignLoading = ref(false)
const completeLoading = ref(false)
const statusLoading = ref(false)

const createForm = ref<CreateWorkOrderRequest>({
  title: '',
  description: '',
  priority: 'MEDIUM',
  assigneeId: undefined,
  dueDate: ''
})

const assignForm = ref({
  assigneeId: undefined as number | undefined,
  content: ''
})

const completeForm = ref({
  content: ''
})

const statusForm = ref({
  action: 'update' as 'update' | 'close',
  content: ''
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = page.value
  
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    if (current <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i)
    } else if (current >= total - 2) {
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      for (let i = current - 2; i <= current + 2; i++) pages.push(i)
    }
  }
  
  return pages
})

const fetchWorkOrders = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value
    }
    
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.priority) params.priority = filters.value.priority
    if (filters.value.assigneeId) params.assigneeId = filters.value.assigneeId
    if (filters.value.keyword) params.keyword = filters.value.keyword
    
    const result = await get('/api/workorders', params)
    if (result?.success) {
      workOrders.value = result.data
      total.value = result.total
      totalPages.value = result.totalPages
    }
  } catch (e) {
    console.error('Failed to fetch work orders:', e)
  } finally {
    loading.value = false
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

const changePage = (newPage: number) => {
  if (newPage < 1 || newPage > totalPages.value) return
  page.value = newPage
  fetchWorkOrders()
}

const resetFilters = () => {
  filters.value = {
    status: '',
    priority: '',
    assigneeId: undefined,
    keyword: ''
  }
  page.value = 1
  fetchWorkOrders()
}

const openCreateDialog = () => {
  createForm.value = {
    title: '',
    description: '',
    priority: 'MEDIUM',
    assigneeId: undefined,
    dueDate: ''
  }
  showCreateDialog.value = true
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
}

const createWorkOrder = async () => {
  if (!createForm.value.title.trim()) return
  
  createLoading.value = true
  try {
    const result = await post('/api/workorders', createForm.value)
    if (result?.success) {
      closeCreateDialog()
      fetchWorkOrders()
    }
  } catch (e) {
    console.error('Failed to create work order:', e)
  } finally {
    createLoading.value = false
  }
}

const openAssignDialog = (wo: WorkOrder) => {
  selectedWorkOrder.value = wo
  assignForm.value = {
    assigneeId: wo.assigneeId,
    content: ''
  }
  showAssignDialog.value = true
}

const closeAssignDialog = () => {
  showAssignDialog.value = false
  selectedWorkOrder.value = null
}

const assignWorkOrder = async () => {
  if (!selectedWorkOrder.value || !assignForm.value.assigneeId) return
  
  assignLoading.value = true
  try {
    const result = await put(`/api/workorders/${selectedWorkOrder.value.id}`, {
      action: 'assign',
      assigneeId: assignForm.value.assigneeId,
      content: assignForm.value.content || '分配工单'
    })
    if (result?.success) {
      closeAssignDialog()
      fetchWorkOrders()
    }
  } catch (e) {
    console.error('Failed to assign work order:', e)
  } finally {
    assignLoading.value = false
  }
}

const startWorkOrder = async (wo: WorkOrder) => {
  try {
    const result = await put(`/api/workorders/${wo.id}`, {
      action: 'start',
      content: '开始处理工单'
    })
    if (result?.success) {
      fetchWorkOrders()
    }
  } catch (e) {
    console.error('Failed to start work order:', e)
  }
}

const openCompleteDialog = (wo: WorkOrder) => {
  selectedWorkOrder.value = wo
  completeForm.value = {
    content: ''
  }
  showCompleteDialog.value = true
}

const closeCompleteDialog = () => {
  showCompleteDialog.value = false
  selectedWorkOrder.value = null
}

const completeWorkOrder = async () => {
  if (!selectedWorkOrder.value || !completeForm.value.content.trim()) return
  
  completeLoading.value = true
  try {
    const result = await put(`/api/workorders/${selectedWorkOrder.value.id}`, {
      action: 'complete',
      content: completeForm.value.content
    })
    if (result?.success) {
      closeCompleteDialog()
      fetchWorkOrders()
    }
  } catch (e) {
    console.error('Failed to complete work order:', e)
  } finally {
    completeLoading.value = false
  }
}

const openStatusDialog = (wo: WorkOrder) => {
  selectedWorkOrder.value = wo
  statusForm.value = {
    action: 'update',
    content: ''
  }
  showStatusDialog.value = true
}

const closeStatusDialog = () => {
  showStatusDialog.value = false
  selectedWorkOrder.value = null
}

const updateWorkOrderStatus = async () => {
  if (!selectedWorkOrder.value || !statusForm.value.content.trim()) return
  
  statusLoading.value = true
  try {
    const action = statusForm.value.action === 'close' ? 'close' : 'update'
    const result = await put(`/api/workorders/${selectedWorkOrder.value.id}`, {
      action,
      content: statusForm.value.content
    })
    if (result?.success) {
      closeStatusDialog()
      fetchWorkOrders()
    }
  } catch (e) {
    console.error('Failed to update work order status:', e)
  } finally {
    statusLoading.value = false
  }
}

const viewDetail = async (wo: WorkOrder) => {
  selectedWorkOrder.value = wo
  workOrderDetail.value = null
  showDetailDialog.value = true
  
  try {
    const result = await get(`/api/workorders/${wo.id}`)
    if (result?.success) {
      workOrderDetail.value = result.data
    }
  } catch (e) {
    console.error('Failed to fetch work order detail:', e)
  }
}

const closeDetailDialog = () => {
  showDetailDialog.value = false
  selectedWorkOrder.value = null
  workOrderDetail.value = null
}

const getPriorityClass = (priority: string) => {
  switch (priority) {
    case 'LOW': return 'bg-slate-100 text-slate-700'
    case 'MEDIUM': return 'bg-blue-100 text-blue-700'
    case 'HIGH': return 'bg-orange-100 text-orange-700'
    case 'URGENT': return 'bg-red-100 text-red-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const getPriorityText = (priority: string) => {
  switch (priority) {
    case 'LOW': return '低'
    case 'MEDIUM': return '中'
    case 'HIGH': return '高'
    case 'URGENT': return '紧急'
    default: return priority
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'PENDING': return 'bg-slate-100 text-slate-700'
    case 'ASSIGNED': return 'bg-yellow-100 text-yellow-700'
    case 'PROCESSING': return 'bg-blue-100 text-blue-700'
    case 'COMPLETED': return 'bg-green-100 text-green-700'
    case 'CLOSED': return 'bg-slate-200 text-slate-600'
    default: return 'bg-slate-100 text-slate-700'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'PENDING': return '待分配'
    case 'ASSIGNED': return '已分配'
    case 'PROCESSING': return '处理中'
    case 'COMPLETED': return '已完成'
    case 'CLOSED': return '已关闭'
    default: return status
  }
}

const getActionClass = (action: string) => {
  switch (action) {
    case 'created': return 'bg-blue-100 text-blue-700'
    case 'assigned': return 'bg-yellow-100 text-yellow-700'
    case 'started': return 'bg-blue-100 text-blue-700'
    case 'completed': return 'bg-green-100 text-green-700'
    case 'closed': return 'bg-slate-200 text-slate-600'
    default: return 'bg-purple-100 text-purple-700'
  }
}

const getActionText = (action: string) => {
  switch (action) {
    case 'created': return '创建'
    case 'assigned': return '分配'
    case 'started': return '开始处理'
    case 'completed': return '完成'
    case 'closed': return '关闭'
    case 'updated': return '更新'
    default: return action
  }
}

const isOverdue = (wo: WorkOrder | WorkOrderDetail | null) => {
  if (!wo?.dueDate) return false
  if (wo.status === 'COMPLETED' || wo.status === 'CLOSED') return false
  return new Date(wo.dueDate) < new Date()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN')
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchWorkOrders()
  fetchUsers()
})
</script>
