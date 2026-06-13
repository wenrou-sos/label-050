import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const status = query.status as string | undefined
  const type = query.type as string | undefined
  const userId = event.context.userId

  const where: any = { userId }

  if (status) {
    where.status = status
  }
  if (type) {
    where.type = type
  }

  const [reminders, total, unreadCount] = await Promise.all([
    prisma.workOrderReminder.findMany({
      where,
      include: {
        workOrder: {
          select: {
            id: true,
            code: true,
            title: true,
            priority: true,
            status: true,
            assignee: { select: { id: true, username: true, realName: true } }
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.workOrderReminder.count({ where }),
    prisma.workOrderReminder.count({
      where: { userId, status: 'UNREAD' }
    })
  ])

  const data = reminders.map(r => ({
    id: r.id,
    workOrderId: r.workOrderId,
    workOrderCode: r.workOrder?.code,
    workOrderTitle: r.workOrder?.title,
    workOrderPriority: r.workOrder?.priority,
    workOrderStatus: r.workOrder?.status,
    type: r.type,
    title: r.title,
    content: r.content,
    status: r.status,
    readAt: r.readAt,
    createdAt: r.createdAt
  }))

  return {
    success: true,
    data,
    total,
    unreadCount,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
