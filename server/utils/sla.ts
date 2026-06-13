import type { WorkOrderPriority } from '@prisma/client'

export const SLA_HOURS: Record<WorkOrderPriority, number> = {
  URGENT: 4,
  HIGH: 8,
  MEDIUM: 24,
  LOW: 72
}

export const SLA_WARNING_RATIO = 0.2

export function calculateSlaDueDate(
  priority: WorkOrderPriority,
  from: Date = new Date()
): Date {
  const hours = SLA_HOURS[priority] || SLA_HOURS.MEDIUM
  return new Date(from.getTime() + hours * 60 * 60 * 1000)
}

export function getNextPriority(
  priority: WorkOrderPriority
): WorkOrderPriority {
  const order: WorkOrderPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  const idx = order.indexOf(priority)
  if (idx < 0 || idx >= order.length - 1) return 'URGENT'
  return order[idx + 1]
}

export function getPriorityLabel(priority: WorkOrderPriority): string {
  const labels: Record<WorkOrderPriority, string> = {
    LOW: '低',
    MEDIUM: '中',
    HIGH: '高',
    URGENT: '紧急'
  }
  return labels[priority] || '中'
}
