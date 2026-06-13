import { PrismaClient } from '@prisma/client'
import {
  SLA_HOURS,
  SLA_WARNING_RATIO,
  getNextPriority,
  getPriorityLabel
} from '~/server/utils/sla'

const prisma = new PrismaClient()

let slaInterval: ReturnType<typeof setInterval> | null = null

async function processSlaMonitoring() {
  try {
    const now = new Date()

    const activeWorkOrders = await prisma.workOrder.findMany({
      where: {
        status: {
          in: ['PENDING', 'ASSIGNED', 'PROCESSING']
        },
        slaDueDate: {
          not: null
        }
      },
      include: {
        assignee: { select: { id: true, username: true, realName: true } }
      }
    })

    for (const wo of activeWorkOrders) {
      if (!wo.slaDueDate) continue

      const slaDue = new Date(wo.slaDueDate).getTime()
      const totalHours = SLA_HOURS[wo.priority] || SLA_HOURS.MEDIUM
      const totalMs = totalHours * 60 * 60 * 1000
      const remainingMs = slaDue - now.getTime()
      const remainingRatio = remainingMs / totalMs

      if (remainingMs <= 0 && !wo.slaEscalated && wo.priority !== 'URGENT') {
        const newPriority = getNextPriority(wo.priority)

        await prisma.workOrder.update({
          where: { id: wo.id },
          data: {
            priority: newPriority,
            slaDueDate: new Date(now.getTime() + (SLA_HOURS[newPriority] || SLA_HOURS.MEDIUM) * 60 * 60 * 1000),
            slaEscalated: true,
            slaNotified: false
          }
        })

        await prisma.workOrderRecord.create({
          data: {
            workOrderId: wo.id,
            userId: 1,
            action: 'sla_escalated',
            content: `SLA 超期，优先级自动从【${getPriorityLabel(wo.priority)}】升级为【${getPriorityLabel(newPriority)}】`
          }
        })

        if (wo.assigneeId) {
          await prisma.workOrderReminder.create({
            data: {
              workOrderId: wo.id,
              userId: wo.assigneeId,
              type: 'SLA_ESCALATED',
              title: `工单 ${wo.code} 优先级已自动升级`,
              content: `工单「${wo.title}」SLA 超期，优先级已从【${getPriorityLabel(wo.priority)}】升级为【${getPriorityLabel(newPriority)}】，请尽快处理。`
            }
          })
        }

        if (wo.creatorId && wo.creatorId !== wo.assigneeId) {
          await prisma.workOrderReminder.create({
            data: {
              workOrderId: wo.id,
              userId: wo.creatorId,
              type: 'SLA_ESCALATED',
              title: `工单 ${wo.code} 优先级已自动升级`,
              content: `工单「${wo.title}」SLA 超期，优先级已从【${getPriorityLabel(wo.priority)}】升级为【${getPriorityLabel(newPriority)}】。`
            }
          })
        }

        console.log(`[SLA] Escalated work order ${wo.code} from ${wo.priority} to ${newPriority}`)
        continue
      }

      if (remainingMs <= 0 && !wo.slaNotified) {
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: { slaNotified: true }
        })

        if (wo.assigneeId) {
          await prisma.workOrderReminder.create({
            data: {
              workOrderId: wo.id,
              userId: wo.assigneeId,
              type: 'SLA_OVERDUE',
              title: `工单 ${wo.code} 已超期`,
              content: `工单「${wo.title}」已超出 SLA 期望完成时间，请立即处理！`
            }
          })
        }

        console.log(`[SLA] Overdue notification sent for work order ${wo.code}`)
        continue
      }

      if (remainingRatio <= SLA_WARNING_RATIO && remainingMs > 0 && !wo.slaNotified) {
        await prisma.workOrder.update({
          where: { id: wo.id },
          data: { slaNotified: true }
        })

        const remainingMinutes = Math.ceil(remainingMs / (1000 * 60))
        const remainingText = remainingMinutes >= 60
          ? `${Math.floor(remainingMinutes / 60)}小时${remainingMinutes % 60}分钟`
          : `${remainingMinutes}分钟`

        if (wo.assigneeId) {
          await prisma.workOrderReminder.create({
            data: {
              workOrderId: wo.id,
              userId: wo.assigneeId,
              type: 'SLA_WARNING',
              title: `工单 ${wo.code} 即将超期`,
              content: `工单「${wo.title}」距离 SLA 期望完成时间仅剩 ${remainingText}，请尽快处理。`
            }
          })
        }

        console.log(`[SLA] Warning notification sent for work order ${wo.code}, remaining: ${remainingText}`)
      }
    }
  } catch (e) {
    console.error('SLA monitoring error:', e)
  }
}

export default defineNitroPlugin(() => {
  slaInterval = setInterval(processSlaMonitoring, 60 * 1000)

  setTimeout(processSlaMonitoring, 5000)

  console.log('SLA monitoring cron started (1min interval)')
})
