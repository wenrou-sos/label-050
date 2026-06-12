import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { reportMonth, groupBy } = body

  if (!reportMonth) {
    throw createError({
      statusCode: 400,
      statusMessage: '报表月份不能为空'
    })
  }

  const [year, month] = reportMonth.split('-').map(Number)
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 1)

  const records = await prisma.temperatureRecord.findMany({
    where: {
      recordTime: { gte: startDate, lt: endDate }
    },
    include: {
      sensor: { include: { location: true, goods: true } }
    },
    orderBy: { recordTime: 'asc' }
  })

  const groupField = groupBy || 'location'
  const statsMap = new Map<string, any>()

  for (const record of records) {
    let key = ''
    let locationId: number | null = null
    let locationName = ''
    let goodsType = ''
    let sensorId: number | null = null
    let sensorName = ''

    if (groupField === 'location') {
      key = `loc_${record.locationId}`
      locationId = record.locationId
      locationName = record.sensor?.location?.name || '未知位置'
    } else if (groupField === 'sensor') {
      key = `sensor_${record.sensorId}`
      sensorId = record.sensorId
      sensorName = record.sensor?.name || '未知传感器'
      locationId = record.locationId
      locationName = record.sensor?.location?.name || ''
    } else if (groupField === 'goods') {
      const gid = record.sensor?.goodsId || 0
      key = `goods_${gid}`
      goodsType = record.sensor?.goods?.type || '未知货物类型'
      locationId = record.locationId
    }

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        key,
        locationId,
        locationName,
        goodsType,
        sensorId,
        sensorName,
        totalMinutes: 0,
        compliantMinutes: 0,
        abnormalMinutes: 0,
        alertCount: 0
      })
    }

    const stat = statsMap.get(key)!
    stat.totalMinutes++
    if (record.isAbnormal) {
      stat.abnormalMinutes++
    } else {
      stat.compliantMinutes++
    }
  }

  let savedCount = 0
  for (const stat of statsMap.values()) {
    const complianceRate = stat.totalMinutes > 0
      ? Math.round((stat.compliantMinutes / stat.totalMinutes) * 10000) / 100
      : 100

    await prisma.complianceReport.upsert({
      where: {
        reportMonth_locationId_goodsType_sensorId: {
          reportMonth,
          locationId: stat.locationId,
          goodsType: stat.goodsType || '',
          sensorId: stat.sensorId
        }
      },
      create: {
        reportMonth,
        locationId: stat.locationId,
        locationName: stat.locationName,
        goodsType: stat.goodsType || null,
        sensorId: stat.sensorId,
        sensorName: stat.sensorName,
        totalDuration: stat.totalMinutes,
        compliantDuration: stat.compliantMinutes,
        complianceRate,
        alertCount: stat.alertCount,
        abnormalMinutes: stat.abnormalMinutes
      },
      update: {
        locationName: stat.locationName,
        sensorName: stat.sensorName,
        totalDuration: stat.totalMinutes,
        compliantDuration: stat.compliantMinutes,
        complianceRate,
        alertCount: stat.alertCount,
        abnormalMinutes: stat.abnormalMinutes,
        generatedAt: new Date()
      }
    })
    savedCount++
  }

  return {
    success: true,
    data: { savedCount, reportMonth, groupBy: groupField },
    message: `成功生成 ${savedCount} 条报表记录`
  }
})
