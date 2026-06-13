import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 50
  const sensorId = query.sensorId ? parseInt(query.sensorId as string) : undefined
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const isAbnormal = query.isAbnormal ? query.isAbnormal === 'true' : undefined

  const where: any = {}

  if (sensorId) {
    where.sensorId = sensorId
  }
  if (locationId) {
    where.locationId = locationId
  }
  if (startTime) {
    where.recordTime = { ...where.recordTime, gte: new Date(startTime) }
  }
  if (endTime) {
    where.recordTime = { ...where.recordTime, lte: new Date(endTime) }
  }
  if (isAbnormal !== undefined) {
    where.isAbnormal = isAbnormal
  }

  const [records, total] = await Promise.all([
    prisma.temperatureRecord.findMany({
      where,
      include: {
        sensor: {
          select: {
            id: true,
            name: true,
            code: true,
            warningMin: true,
            warningMax: true,
            location: { select: { id: true, name: true } }
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { recordTime: 'desc' }
    }),
    prisma.temperatureRecord.count({ where })
  ])

  const data = records.map(record => ({
    id: record.id.toString(),
    sensorId: record.sensorId,
    sensorName: record.sensor?.name,
    sensorCode: record.sensor?.code,
    locationId: record.locationId ?? record.sensor?.location?.id,
    locationName: record.sensor?.location?.name,
    temperature: Number(record.temperature),
    humidity: record.humidity ? Number(record.humidity) : null,
    recordTime: record.recordTime,
    isAbnormal: record.isAbnormal,
    abnormalType: record.abnormalType,
    warningMin: record.sensor?.warningMin,
    warningMax: record.sensor?.warningMax
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
