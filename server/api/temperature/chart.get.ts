import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sensorId = query.sensorId ? parseInt(query.sensorId as string) : undefined
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const hours = query.hours ? parseInt(query.hours as string) : undefined

  if (!sensorId && !locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请指定传感器或位置'
    })
  }

  const where: any = {}

  if (sensorId) {
    where.sensorId = sensorId
  }
  if (locationId) {
    where.locationId = locationId
  }

  if (startTime) {
    where.recordTime = { ...where.recordTime, gte: new Date(startTime) }
  } else if (hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    where.recordTime = { ...where.recordTime, gte: since }
  }

  if (endTime) {
    where.recordTime = { ...where.recordTime, lte: new Date(endTime) }
  }

  const records = await prisma.temperatureRecord.findMany({
    where,
    orderBy: { recordTime: 'asc' },
    take: 1000
  })

  const labels = records.map(r => {
    const d = new Date(r.recordTime)
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })
  const temperatures = records.map(r => r.temperature)

  return {
    success: true,
    data: {
      labels,
      temperatures,
      records
    }
  }
})
