import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const body = await readBody(event)
  const { status, remark } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '告警ID不能为空'
    })
  }

  const alert = await prisma.alert.findUnique({ where: { id } })
  if (!alert) {
    throw createError({
      statusCode: 404,
      statusMessage: '告警不存在'
    })
  }

  const updateData: any = {}
  const now = new Date()

  if (status === 'handled' && alert.status === 'pending') {
    updateData.status = 'handled'
    updateData.handledAt = now
  } else if (status === 'resolved' && (alert.status === 'pending' || alert.status === 'handled')) {
    updateData.status = 'resolved'
    updateData.handledAt = alert.handledAt || now
    updateData.resolvedAt = now
  } else if (status) {
    updateData.status = status
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: updateData
  })

  return {
    success: true,
    data: updated,
    message: '告警状态更新成功'
  }
})
