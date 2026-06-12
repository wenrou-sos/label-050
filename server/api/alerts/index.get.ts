import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const sensorId = query.sensorId ? parseInt(query.sensorId as string) : undefined
  const level = query.level as string | undefined
  const status = query.status as string | undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const keyword = query.keyword as string | undefined

  const where: any = {}

  if (sensorId) {
    where.sensorId = sensorId
  }
  if (level) {
    where.level = level
  }
  if (status) {
    where.status = status
  }
  if (startTime) {
    where.createdAt = { ...where.createdAt, gte: new Date(startTime) }
  }
  if (endTime) {
    where.createdAt = { ...where.createdAt, lte: new Date(endTime) }
  }
  if (keyword) {
    where.OR = [
      { title: { contains: keyword } },
      { content: { contains: keyword } }
    ]
  }

  const [alerts, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: {
        sensor: { select: { id: true, name: true, code: true } },
        createdBy: { select: { id: true, username: true, realName: true } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.alert.count({ where })
  ])

  const data = alerts.map(alert => ({
    id: alert.id,
    sensorId: alert.sensorId,
    sensorName: alert.sensor?.name,
    sensorCode: alert.sensor?.code,
    alertType: alert.alertType,
    level: alert.level,
    title: alert.title,
    content: alert.content,
    temperature: alert.temperature,
    thresholdMin: alert.thresholdMin,
    thresholdMax: alert.thresholdMax,
    status: alert.status,
    notifSys: alert.notifSys,
    notifEmail: alert.notifEmail,
    notifSms: alert.notifSms,
    createdById: alert.createdById,
    createdByName: alert.createdBy?.realName || alert.createdBy?.username,
    handledAt: alert.handledAt,
    resolvedAt: alert.resolvedAt,
    createdAt: alert.createdAt
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
