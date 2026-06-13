import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const userId = event.context.userId
  const { ids, all } = body

  const where: any = { userId, status: 'UNREAD' }

  if (!all && ids && Array.isArray(ids) && ids.length > 0) {
    where.id = { in: ids.map((id: any) => parseInt(id)) }
  }

  const result = await prisma.workOrderReminder.updateMany({
    where,
    data: {
      status: 'READ',
      readAt: new Date()
    }
  })

  return {
    success: true,
    data: { count: result.count },
    message: `已标记 ${result.count} 条提醒为已读`
  }
})
