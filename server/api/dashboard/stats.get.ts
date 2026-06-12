import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const [totalSensors, onlineSensors, pendingAlerts, pendingWorkOrders, recentRecords] = await Promise.all([
    prisma.sensor.count(),
    prisma.sensor.count({ where: { status: 'online' } }),
    prisma.alert.count({ where: { status: 'pending' } }),
    prisma.workOrder.count({ where: { status: { in: ['PENDING', 'ASSIGNED', 'PROCESSING'] } } }),
    prisma.temperatureRecord.findMany({
      orderBy: { recordTime: 'desc' },
      take: 100,
      include: { sensor: true }
    })
  ])

  const sensorTemps = new Map<number, number>()
  for (const record of recentRecords) {
    if (!sensorTemps.has(record.sensorId)) {
      sensorTemps.set(record.sensorId, record.temperature)
    }
  }

  let avgTemperature = 0
  if (sensorTemps.size > 0) {
    let sum = 0
    for (const temp of sensorTemps.values()) {
      sum += temp
    }
    avgTemperature = Math.round((sum / sensorTemps.size) * 100) / 100
  }

  const now = new Date()
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [totalRecords24h, abnormalRecords24h] = await Promise.all([
    prisma.temperatureRecord.count({
      where: { recordTime: { gte: twentyFourHoursAgo } }
    }),
    prisma.temperatureRecord.count({
      where: { recordTime: { gte: twentyFourHoursAgo }, isAbnormal: true }
    })
  ])

  let complianceRate = 100
  if (totalRecords24h > 0) {
    complianceRate = Math.round(((totalRecords24h - abnormalRecords24h) / totalRecords24h) * 10000) / 100
  }

  const alertStats = await prisma.alert.groupBy({
    by: ['level'],
    where: { status: 'pending' },
    _count: true
  })

  const alertCounts: Record<string, number> = {
    warning: 0,
    critical: 0,
    general: 0
  }
  for (const stat of alertStats) {
    alertCounts[stat.level] = stat._count
  }

  const data = {
    totalSensors,
    onlineSensors,
    offlineSensors: totalSensors - onlineSensors,
    activeAlerts: pendingAlerts,
    pendingWorkOrders,
    avgTemperature,
    complianceRate,
    alertCounts,
    records24h: totalRecords24h,
    abnormalRecords24h
  }

  return {
    success: true,
    data
  }
})
