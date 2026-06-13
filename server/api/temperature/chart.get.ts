import { prisma } from '~/server/utils/prisma'

const parseSensorIds = (query: any): number[] | undefined => {
  const raw = query.sensorIds || query.sensorId
  if (!raw) return undefined
  if (Array.isArray(raw)) {
    return raw.map(v => parseInt(String(v))).filter(v => !isNaN(v))
  }
  const str = String(raw)
  return str.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
}

const buildTimeWhere = (startTime?: string, endTime?: string, hours?: number) => {
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
  return timeWhere
}

const fetchSensorInfos = async (sensorIds: number[]) => {
  const sensorInfoMap = new Map<number, { id: number; name: string; warningMin: number; warningMax: number }>()
  const sensorInfos = await prisma.sensor.findMany({
    where: { id: { in: sensorIds } },
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
  return sensorInfoMap
}

const fetchChartSeries = async (
  sensorIds: number[],
  timeWhere: any,
  sensorInfoMap: Map<number, any>,
  normalizeToHours: boolean = false,
  baseTime?: Date
) => {
  const allRecords = await prisma.temperatureRecord.findMany({
    where: {
      sensorId: { in: sensorIds },
      recordTime: timeWhere
    },
    orderBy: { recordTime: 'asc' },
    take: 3000
  })

  const timeLabelsSet = new Set<string>()
  const sensorRecordMap = new Map<number, Map<string, number>>()

  sensorIds.forEach(sid => {
    sensorRecordMap.set(sid, new Map())
  })

  allRecords.forEach(r => {
    const d = new Date(r.recordTime)
    let label: string
    if (normalizeToHours && baseTime) {
      const diffMs = d.getTime() - baseTime.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      label = `+${hours}:${String(mins).padStart(2, '0')}`
    } else {
      label = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    timeLabelsSet.add(label)
    const m = sensorRecordMap.get(r.sensorId)
    if (m) {
      m.set(label, Number(r.temperature))
    }
  })

  const labels = Array.from(timeLabelsSet).sort((a, b) => {
    if (normalizeToHours) {
      const parseLabel = (l: string) => {
        const match = l.match(/\+(\d+):(\d+)/)
        return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0
      }
      return parseLabel(a) - parseLabel(b)
    }
    return a.localeCompare(b)
  })

  const series = sensorIds.map(sid => {
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

  return { labels, series }
}

const getTargetSensorIds = async (sensorIds: number[] | undefined, locationId: number | undefined) => {
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
  return targetSensorIds
}

const formatDateRange = (start?: string, end?: string) => {
  if (!start || !end) return ''
  const s = new Date(start)
  const e = new Date(end)
  const fmt = (d: Date) => d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  return `${fmt(s)} ~ ${fmt(e)}`
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const sensorIds = parseSensorIds(query)
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const hours = query.hours ? parseInt(query.hours as string) : undefined
  const compareMode = query.compareMode === 'true'
  const startTimeA = query.startTimeA as string | undefined
  const endTimeA = query.endTimeA as string | undefined
  const startTimeB = query.startTimeB as string | undefined
  const endTimeB = query.endTimeB as string | undefined

  if ((!sensorIds || sensorIds.length === 0) && !locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: '请指定传感器或位置'
    })
  }

  const targetSensorIds = await getTargetSensorIds(sensorIds, locationId)

  if (targetSensorIds.length === 0) {
    return {
      success: true,
      data: {
        labels: [],
        series: [],
        compareMode: false
      }
    }
  }

  const sensorInfoMap = await fetchSensorInfos(targetSensorIds)

  if (compareMode && startTimeA && endTimeA && startTimeB && endTimeB) {
    const timeWhereA = buildTimeWhere(startTimeA, endTimeA)
    const timeWhereB = buildTimeWhere(startTimeB, endTimeB)

    const baseTimeA = new Date(startTimeA)
    const baseTimeB = new Date(startTimeB)

    const [dataA, dataB] = await Promise.all([
      fetchChartSeries(targetSensorIds, timeWhereA, sensorInfoMap, true, baseTimeA),
      fetchChartSeries(targetSensorIds, timeWhereB, sensorInfoMap, true, baseTimeB)
    ])

    const allLabels = Array.from(new Set([...dataA.labels, ...dataB.labels])).sort((a, b) => {
      const parseLabel = (l: string) => {
        const match = l.match(/\+(\d+):(\d+)/)
        return match ? parseInt(match[1]) * 60 + parseInt(match[2]) : 0
      }
      return parseLabel(a) - parseLabel(b)
    })

    const padSeries = (series: any[], labels: string[], targetLabels: string[]) => {
      return series.map((s: any) => {
        const tempMap = new Map<string, number | null>()
        labels.forEach((l, i) => {
          tempMap.set(l, s.temperatures[i])
        })
        const paddedTemps = targetLabels.map(l => {
          const v = tempMap.get(l)
          return v === undefined ? null : v
        })
        return { ...s, temperatures: paddedTemps }
      })
    }

    const seriesA = padSeries(dataA.series, dataA.labels, allLabels)
    const seriesB = padSeries(dataB.series, dataB.labels, allLabels)

    return {
      success: true,
      data: {
        compareMode: true,
        labels: allLabels,
        seriesA,
        seriesB,
        periodA: {
          startTime: startTimeA,
          endTime: endTimeA,
          label: formatDateRange(startTimeA, endTimeA)
        },
        periodB: {
          startTime: startTimeB,
          endTime: endTimeB,
          label: formatDateRange(startTimeB, endTimeB)
        }
      }
    }
  }

  const timeWhere = buildTimeWhere(startTime, endTime, hours)
  const { labels, series } = await fetchChartSeries(targetSensorIds, timeWhere, sensorInfoMap)

  return {
    success: true,
    data: {
      compareMode: false,
      labels,
      series
    }
  }
})
