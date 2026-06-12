import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const body = await readBody(event)
  const userId = event.context.userId
  const { action, content } = body

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '工单ID不能为空'
    })
  }

  if (!action || !content) {
    throw createError({
      statusCode: 400,
      statusMessage: '操作类型和内容不能为空'
    })
  }

  const workOrder = await prisma.workOrder.findUnique({ where: { id } })
  if (!workOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在'
    })
  }

  const record = await prisma.workOrderRecord.create({
    data: {
      workOrderId: id,
      userId,
      action,
      content
    },
    include: {
      user: { select: { id: true, username: true, realName: true } }
    }
  })

  return {
    success: true,
    data: record,
    message: '处理记录添加成功'
  }
})
