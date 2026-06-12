import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reportMonth = query.reportMonth as string | undefined
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const groupBy = (query.groupBy as string) || 'location'

  const now = new Date()
  const monthStr = reportMonth || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [year, month] = monthStr.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const where: any = {
    recordTime: {
      gte: startDate,
      lt: endDate
    }
  }
  if (locationId) {
    where.locationId = locationId
  }

  const records = await prisma.temperatureRecord.findMany({
    where,
    include: {
      sensor: { include: { location: true, goods: true } },
      location: true
    },
    orderBy: { recordTime: 'asc' }
  })

  const statsMap = new Map<string, any>()

  for (const record of records) {
    let key = ''
    let name = ''

    if (groupBy === 'location') {
      key = `loc_${record.locationId}`
      name = record.location?.name || '未知位置'
    } else if (groupBy === 'sensor') {
      key = `sensor_${record.sensorId}`
      name = record.sensor?.name || '未知传感器'
    } else if (groupBy === 'goods') {
      key = `goods_${record.sensor?.goodsId || 'unknown'}`
      name = record.sensor?.goods?.name || '未知货物'
    }

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        key,
        name,
        totalRecords: 0,
        compliantRecords: 0,
        abnormalRecords: 0,
        alertCount: 0,
        avgTemp: 0,
        temps: [] as number[]
      })
    }

    const stat = statsMap.get(key)!
    stat.totalRecords++
    if (record.isAbnormal) {
      stat.abnormalRecords++
    } else {
      stat.compliantRecords++
    }
    stat.temps.push(record.temperature)
  }

  const reportData = Array.from(statsMap.values()).map(stat => {
    const complianceRate = stat.totalRecords > 0
      ? Math.round((stat.compliantRecords / stat.totalRecords) * 10000) / 100
      : 100
    const avgTemp = stat.temps.length > 0
      ? Math.round((stat.temps.reduce((a: number, b: number) => a + b, 0) / stat.temps.length) * 100) / 100
      : 0

    return {
      key: stat.key,
      name: stat.name,
      totalRecords: stat.totalRecords,
      compliantRecords: stat.compliantRecords,
      abnormalRecords: stat.abnormalRecords,
      complianceRate,
      avgTemp,
      alertCount: stat.alertCount
    }
  })

  const overall = {
    reportMonth: monthStr,
    totalRecords: records.length,
    compliantRecords: records.filter(r => !r.isAbnormal).length,
    abnormalRecords: records.filter(r => r.isAbnormal).length,
    overallComplianceRate: records.length > 0
      ? Math.round(((records.filter(r => !r.isAbnormal).length) / records.length) * 10000) / 100
      : 100
  }

  return {
    success: true,
    data: {
      overall,
      details: reportData
    }
  }
})
