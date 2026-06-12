import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const body = await readBody(event)
  const userId = event.context.userId
  const { priority, assigneeId, dueDate, description } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '告警ID不能为空'
    })
  }

  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      sensor: { select: { id: true, name: true, code: true } }
    }
  })

  if (!alert) {
    throw createError({
      statusCode: 404,
      statusMessage: '告警不存在'
    })
  }

  const lastWorkOrder = await prisma.workOrder.findFirst({
    orderBy: { id: 'desc' }
  })
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
  const seqNum = lastWorkOrder ? (parseInt(lastWorkOrder.code.split('-')[2]) + 1) : 1
  const code = `WO-${dateStr}-${String(seqNum).padStart(3, '0')}`

  const title = `【告警处理】${alert.title} - ${alert.sensor?.name || '未知传感器'}`

  const workOrder = await prisma.workOrder.create({
    data: {
      code,
      title,
      description: description || `告警ID: ${alert.id}\n传感器: ${alert.sensor?.name || '未知'}\n告警级别: ${alert.level}\n告警温度: ${alert.temperature}°C\n阈值范围: ${alert.thresholdMin}°C ~ ${alert.thresholdMax}°C\n告警内容: ${alert.content || ''}`,
      alertId: id,
      priority: priority || 'HIGH',
      status: assigneeId ? 'ASSIGNED' : 'PENDING',
      assigneeId: assigneeId ? parseInt(assigneeId) : null,
      creatorId: userId,
      dueDate: dueDate ? new Date(dueDate) : null,
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
      content: `从告警 #${alert.id} 创建工单：${title}`
    }
  })

  return {
    success: true,
    data: workOrder,
    message: '工单创建成功'
  }
})
