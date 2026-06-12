import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { ids, status, remark } = body

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '告警ID列表不能为空'
    })
  }

  if (!status) {
    throw createError({
      statusCode: 400,
      statusMessage: '状态不能为空'
    })
  }

  const now = new Date()
  const updateData: any = {}

  if (status === 'handled') {
    updateData.status = 'handled'
    updateData.handledAt = now
  } else if (status === 'resolved') {
    updateData.status = 'resolved'
    updateData.resolvedAt = now
  } else {
    updateData.status = status
  }

  const result = await prisma.alert.updateMany({
    where: {
      id: { in: ids }
    },
    data: updateData
  })

  return {
    success: true,
    data: {
      count: result.count
    },
    message: `成功更新 ${result.count} 条告警状态`
  }
})
