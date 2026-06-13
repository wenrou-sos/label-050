import { prisma } from '~/server/utils/prisma'
import { predictTemperature } from '~/server/utils/prediction'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sensorId = query.sensorId ? parseInt(query.sensorId as string) : undefined
  const hours = query.hours ? parseInt(query.hours as string) : 24
  const steps = query.steps ? parseInt(query.steps as string) : 12
  const stepIntervalSec = query.stepIntervalSec ? parseInt(query.stepIntervalSec as string) : 300
  const method = (query.method as 'sma' | 'linear' | 'auto') || 'auto'

  if (!sensorId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请指定传感器ID'
    })
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const [sensor, records] = await Promise.all([
    prisma.sensor.findUnique({
      where: { id: sensorId },
      select: { warningMin: true, warningMax: true }
    }),
    prisma.temperatureRecord.findMany({
      where: {
        sensorId,
        recordTime: { gte: since }
      },
      orderBy: { recordTime: 'asc' },
      take: 500
    })
  ])

  if (!sensor) {
    throw createError({
      statusCode: 404,
      statusMessage: '传感器不存在'
    })
  }

  const formattedRecords = records.map(r => ({
    recordTime: r.recordTime,
    temperature: Number(r.temperature)
  }))

  const prediction = predictTemperature(formattedRecords, {
    steps,
    stepIntervalSec,
    warningMin: Number(sensor.warningMin),
    warningMax: Number(sensor.warningMax),
    method
  })

  return {
    success: true,
    data: prediction
  }
})
