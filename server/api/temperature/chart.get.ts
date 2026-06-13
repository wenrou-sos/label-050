import { prisma } from '~/server/utils/prisma'

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
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const hours = query.hours ? parseInt(query.hours as string) : undefined

  if ((!sensorIds || sensorIds.length === 0) && !locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请指定传感器或位置'
    })
  }

  const timeWhere: any = {}
  if (startTime) {
    timeWhere.gte = new Date(startTime)
  } else if (hours) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    timeWhere.gte = since
  }
  if (endTime) {
    timeWhere.lte = new Date(endTime)
  }

  const sensorWhere: any = {}
  if (sensorIds && sensorIds.length > 0) {
    sensorWhere.sensorId = { in: sensorIds }
  }
  if (locationId) {
    sensorWhere.locationId = locationId
  }

  let targetSensorIds: number[] = []
  if (sensorIds && sensorIds.length > 0) {
    targetSensorIds = sensorIds
  } else if (locationId) {
    const sensors = await prisma.sensor.findMany({
      where: { locationId, status: 'online' },
      select: { id: true },
      take: 5
    })
    targetSensorIds = sensors.map(s => s.id)
  }

  if (targetSensorIds.length === 0) {
    return {
      success: true,
      data: {
        labels: [],
        series: []
      }
    }
  }

  const sensorInfoMap = new Map<number, { id: number; name: string; warningMin: number; warningMax: number }>()
  const sensorInfos = await prisma.sensor.findMany({
    where: { id: { in: targetSensorIds } },
    select: { id: true, name: true, warningMin: true, warningMax: true }
  })
  sensorInfos.forEach(s => {
    sensorInfoMap.set(s.id, {
      id: s.id,
      name: s.name,
      warningMin: Number(s.warningMin),
      warningMax: Number(s.warningMax)
    })
  })

  const allRecords = await prisma.temperatureRecord.findMany({
    where: {
      sensorId: { in: targetSensorIds },
      recordTime: timeWhere
    },
    orderBy: { recordTime: 'asc' },
    take: 3000
  })

  const timeLabelsSet = new Set<string>()
  const sensorRecordMap = new Map<number, Map<string, number>>()

  targetSensorIds.forEach(sid => {
    sensorRecordMap.set(sid, new Map())
  })

  allRecords.forEach(r => {
    const d = new Date(r.recordTime)
    const label = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    timeLabelsSet.add(label)
    const m = sensorRecordMap.get(r.sensorId)
    if (m) {
      m.set(label, Number(r.temperature))
    }
  })

  const labels = Array.from(timeLabelsSet).sort()

  const series = targetSensorIds.map(sid => {
    const info = sensorInfoMap.get(sid)!
    const m = sensorRecordMap.get(sid)!
    const temperatures = labels.map(l => {
      const v = m.get(l)
      return v === undefined ? null : v
    })
    const records = allRecords
      .filter(r => r.sensorId === sid)
      .map(r => ({
        ...r,
        temperature: Number(r.temperature),
        humidity: r.humidity ? Number(r.humidity) : null
      }))

    return {
      sensorId: sid,
      sensorName: info.name,
      warningMin: info.warningMin,
      warningMax: info.warningMax,
      temperatures,
      records
    }
  })

  return {
    success: true,
    data: {
      labels,
      series
    }
  }
})
