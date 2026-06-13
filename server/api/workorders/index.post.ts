import { prisma } from '~/server/utils/prisma'
import { calculateSlaDueDate } from '~/server/utils/sla'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userId = event.context.userId
  const { title, description, alertId, priority, assigneeId, dueDate } = body
  const resolvedPriority: any = priority || 'MEDIUM'

  if (!title) {
    throw createError({
      statusCode: 400,
      statusMessage: '工单标题不能为空'
    })
  }

  const lastWorkOrder = await prisma.workOrder.findFirst({
    orderBy: { id: 'desc' }
  })
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seqNum = lastWorkOrder ? (parseInt(lastWorkOrder.code.split('-')[2]) + 1) : 1
  const code = `WO-${dateStr}-${String(seqNum).padStart(3, '0')}`

  const workOrder = await prisma.workOrder.create({
    data: {
      code,
      title,
      description,
      alertId: alertId ? parseInt(alertId) : null,
      priority: resolvedPriority,
      status: assigneeId ? 'ASSIGNED' : 'PENDING',
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      creatorId: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
      slaDueDate: calculateSlaDueDate(resolvedPriority, now),
      assignedAt: assigneeId ? new Date() : null
    },
    include: {
      assignee: { select: { id: true, username: true, realName: true } },
      creator: { select: { id: true, username: true, realName: true } }
    }
  })

  await prisma.workOrderRecord.create({
    data: {
      workOrderId: workOrder.id,
      userId,
      action: 'created',
      content: `创建工单：${title}`
    }
  })

  return {
    success: true,
    data: workOrder,
    message: '工单创建成功'
  }
})
