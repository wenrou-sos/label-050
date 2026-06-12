import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const status = query.status as string | undefined
  const priority = query.priority as string | undefined
  const assigneeId = query.assigneeId ? parseInt(query.assigneeId as string) : undefined
  const alertId = query.alertId ? parseInt(query.alertId as string) : undefined
  const keyword = query.keyword as string | undefined
  const my = query.my ? query.my === 'true' : false

  const where: any = {}

  if (status) {
    where.status = status
  }
  if (priority) {
    where.priority = priority
  }
  if (assigneeId) {
    where.assigneeId = assigneeId
  }
  if (my) {
    where.assigneeId = event.context.userId
  }
  if (alertId) {
    where.alertId = alertId
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { code: { contains: keyword } },
      { description: { contains: keyword } }
    ]
  }

  const [workOrders, total] = await Promise.all([
    prisma.workOrder.findMany({
      where,
      include: {
        alert: { select: { id: true, title: true, level: true, sensor: { select: { id: true, name: true } } } },
        assignee: { select: { id: true, username: true, realName: true } },
        creator: { select: { id: true, username: true, realName: true } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.workOrder.count({ where })
  ])

  const data = workOrders.map(wo => ({
    id: wo.id,
    code: wo.code,
    title: wo.title,
    description: wo.description,
    alertId: wo.alertId,
    alertTitle: wo.alert?.title,
    alertLevel: wo.alert?.level,
    sensorName: wo.alert?.sensor?.name,
    status: wo.status,
    priority: wo.priority,
    assigneeId: wo.assigneeId,
    assigneeName: wo.assignee?.realName || wo.assignee?.username,
    creatorId: wo.creatorId,
    creatorName: wo.creator?.realName || wo.creator?.username,
    dueDate: wo.dueDate,
    assignedAt: wo.assignedAt,
    startedAt: wo.startedAt,
    completedAt: wo.completedAt,
    closedAt: wo.closedAt,
    createdAt: wo.createdAt
  }))

  return {
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
