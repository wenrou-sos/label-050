export interface UserInfo {
  id: number
  username: string
  email: string
  realName?: string
  phone?: string
  roleId: number
  roleName: string
  permissions: string[]
  status: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T = any> {
  success: boolean
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SensorWithLocation {
  id: number
  name: string
  code: string
  sensorType: string
  locationId: number
  locationName: string
  goodsId?: number
  goodsName?: string
  minTemp: number
  maxTemp: number
  warningMin: number
  warningMax: number
  currentTemp?: number
  lastUpdate?: string
  status: string
}

export interface TemperatureRecordQuery {
  sensorId?: number
  locationId?: number
  startTime?: string
  endTime?: string
  page?: number
  pageSize?: number
  isAbnormal?: boolean
}

export interface ComplianceReportData {
  reportMonth: string
  locationName?: string
  goodsType?: string
  sensorName?: string
  totalDuration: number
  compliantDuration: number
  complianceRate: number
  alertCount: number
  abnormalMinutes: number
}

export interface DashboardStats {
  totalSensors: number
  onlineSensors: number
  activeAlerts: number
  pendingWorkOrders: number
  avgTemperature: number
  complianceRate: number
}

export type WorkOrderStatus = 'PENDING' | 'ASSIGNED' | 'PROCESSING' | 'COMPLETED' | 'CLOSED'

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface WorkOrder {
  id: number
  code: string
  title: string
  description?: string
  alertId?: number
  alertTitle?: string
  alertLevel?: string
  sensorName?: string
  status: WorkOrderStatus
  priority: WorkOrderPriority
  assigneeId?: number
  assigneeName?: string
  creatorId: number
  creatorName?: string
  dueDate?: string
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  closedAt?: string
  createdAt: string
}

export interface WorkOrderDetail extends WorkOrder {
  alert?: {
    id: number
    title: string
    level: string
    content?: string
    temperature: number
    sensor: {
      id: number
      name: string
      code: string
    }
  }
  assignee?: {
    id: number
    username: string
    realName?: string
    phone?: string
  }
  creator?: {
    id: number
    username: string
    realName?: string
    phone?: string
  }
  records: WorkOrderRecord[]
  attachments: WorkOrderAttachment[]
}

export interface WorkOrderRecord {
  id: number
  workOrderId: number
  userId: number
  user: {
    id: number
    username: string
    realName?: string
  }
  action: string
  content: string
  createdAt: string
}

export interface WorkOrderAttachment {
  id: number
  workOrderId: number
  fileName: string
  filePath: string
  fileType?: string
  fileSize?: number
  uploadedAt: string
}

export interface WorkOrderQuery {
  page?: number
  pageSize?: number
  status?: WorkOrderStatus
  priority?: WorkOrderPriority
  assigneeId?: number
  keyword?: string
  my?: boolean
}

export interface CreateWorkOrderRequest {
  title: string
  description?: string
  alertId?: number
  priority?: WorkOrderPriority
  assigneeId?: number
  dueDate?: string
}

export interface UpdateWorkOrderRequest {
  action: 'assign' | 'start' | 'complete' | 'close' | 'update'
  content?: string
  assigneeId?: number
  status?: WorkOrderStatus
}

export interface User {
  id: number
  username: string
  email: string
  realName?: string
  phone?: string
  roleId: number
  status: string
  role?: {
    id: number
    name: string
    description?: string
  }
}
