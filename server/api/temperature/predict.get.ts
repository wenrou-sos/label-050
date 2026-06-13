import { prisma } from '~/server/utils/prisma'
import { predictTemperature } from '~/server/utils/prediction'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const parseSensorIds = (): number[] | undefined => {
    const raw = query.sensorIds || query.sensorId
    if (!raw) return undefined
    if (Array.isArray(raw)) {
      return raw.map(v => parseInt(String(v))).filter(v => !isNaN(v))
    }
    const str = String(raw)
    return str.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
  }

  const sensorIds = parseSensorIds()
  const hours = query.hours ? parseInt(query.hours as string) : 24
  const steps = query.steps ? parseInt(query.steps as string) : 12
  const stepIntervalSec = query.stepIntervalSec ? parseInt(query.stepIntervalSec as string) : 300
  const method = (query.method as 'sma' | 'linear' | 'auto') || 'auto'

  if (!sensorIds || sensorIds.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: '请指定传感器ID'
    })
  }

  const since = new Date(Date.now() - hours * 60 * 60 * 1000)

  const sensors = await prisma.sensor.findMany({
    where: { id: { in: sensorIds } },
    select: { id: true, name: true, warningMin: true, warningMax: true }
  })

  if (sensors.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: '传感器不存在'
    })
  }

  const records = await prisma.temperatureRecord.findMany({
    where: {
      sensorId: { in: sensorIds },
      recordTime: { gte: since }
    },
    orderBy: { recordTime: 'asc' },
    take: 500 * sensorIds.length
  })

  const predictions = await Promise.all(sensors.map(async (sensor) => {
    const sensorRecords = records
      .filter(r => r.sensorId === sensor.id)
      .map(r => ({
        recordTime: r.recordTime,
        temperature: Number(r.temperature)
      }))

    const prediction = predictTemperature(sensorRecords, {
      steps,
      stepIntervalSec,
      warningMin: Number(sensor.warningMin),
      warningMax: Number(sensor.warningMax),
      method
    })

    return {
      sensorId: sensor.id,
      sensorName: sensor.name,
      warningMin: Number(sensor.warningMin),
      warningMax: Number(sensor.warningMax),
      ...prediction
    }
  }))

  return {
    success: true,
    data: sensorIds.length === 1 ? predictions[0] : predictions
  }
})
