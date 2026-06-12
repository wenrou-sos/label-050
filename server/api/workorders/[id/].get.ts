import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '工单ID不能为空'
    })
  }

  const workOrder = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      alert: {
        select: {
          id: true, title: true, level: true, content: true, temperature: true,
          sensor: { select: { id: true, name: true, code: true } }
        }
      },
      assignee: { select: { id: true, username: true, realName: true, phone: true } },
      creator: { select: { id: true, username: true, realName: true, phone: true } },
      records: {
        include: { user: { select: { id: true, username: true, realName: true } } },
        orderBy: { createdAt: 'desc' }
      },
      attachments: { orderBy: { uploadedAt: 'desc' } }
    }
  })

  if (!workOrder) {
    throw createError({
      statusCode: 404,
      statusMessage: '工单不存在'
    })
  }

  return {
    success: true,
    data: workOrder
  }
})
