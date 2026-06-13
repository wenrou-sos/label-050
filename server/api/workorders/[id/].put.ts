import { prisma } from '~/server/utils/prisma'
import { calculateSlaDueDate } from '~/server/utils/sla'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const body = await readBody(event)
  const userId = event.context.userId
  const { action, content, assigneeId, status, priority } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '工单ID不能为空'
    })
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在'
    })
  }

  const updateData: any = {}
  let actionType = action || 'updated'
  let recordContent = content || '更新工单'

  if (action === 'assign' && assigneeId) {
    updateData.assigneeId = parseInt(assigneeId)
    updateData.status = 'ASSIGNED'
    updateData.assignedAt = new Date()
    actionType = 'assigned'
    recordContent = content || '分配工单给处理人员'
  } else if (action === 'start') {
    if (workOrder.status !== 'ASSIGNED' && workOrder.status !== 'PENDING') {
      throw createError({
        statusCode: 400,
        statusMessage: '只有待分配或已分配的工单可以开始处理'
      })
    }
    updateData.status = 'PROCESSING'
    updateData.startedAt = new Date()
    actionType = 'started'
    recordContent = content || '开始处理工单'
  } else if (action === 'complete') {
    if (workOrder.status !== 'PROCESSING') {
      throw createError({
        statusCode: 400,
        statusMessage: '只有处理中的工单可以完成'
      })
    }
    updateData.status = 'COMPLETED'
    updateData.completedAt = new Date()
    actionType = 'completed'
    recordContent = content || '工单处理完成'
  } else if (action === 'close') {
    updateData.status = 'CLOSED'
    updateData.closedAt = new Date()
    actionType = 'closed'
    recordContent = content || '关闭工单'
  } else if (status) {
    updateData.status = status
  }

  if (priority && priority !== workOrder.priority) {
    updateData.priority = priority
    updateData.slaDueDate = calculateSlaDueDate(priority, workOrder.createdAt)
    updateData.slaNotified = false
    updateData.slaEscalated = false
  }

  const updated = await prisma.workOrder.update({
    where: { id },
    data: updateData
  })

  await prisma.workOrderRecord.create({
    data: {
      workOrderId: id,
      userId,
      action: actionType,
      content: recordContent
    }
  })

  return {
    success: true,
    data: updated,
    message: '工单更新成功'
  }
})
