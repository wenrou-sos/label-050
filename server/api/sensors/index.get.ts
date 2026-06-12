import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 10
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const status = query.status as string | undefined
  const keyword = query.keyword as string | undefined

  const where: any = {}

  if (locationId) {
    where.locationId = locationId
  }
  if (status) {
    where.status = status
  }
  if (keyword) {
    where.OR = [
      { name: { contains: keyword } },
      { code: { contains: keyword } }
    ]
  }

  const [sensors, total] = await Promise.all([
    prisma.sensor.findMany({
      where,
      include: {
        location: { select: { id: true, name: true, type: true } },
        goods: { select: { id: true, name: true, type: true } }
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'asc' }
    }),
    prisma.sensor.count({ where })
  ])

  const data = sensors.map(sensor => ({
    id: sensor.id,
    name: sensor.name,
    code: sensor.code,
    sensorType: sensor.sensorType,
    locationId: sensor.locationId,
    locationName: sensor.location?.name,
    locationType: sensor.location?.type,
    goodsId: sensor.goodsId,
    goodsName: sensor.goods?.name,
    goodsType: sensor.goods?.type,
    model: sensor.model,
    manufacturer: sensor.manufacturer,
    installDate: sensor.installDate,
    minTemp: sensor.minTemp,
    maxTemp: sensor.maxTemp,
    warningMin: sensor.warningMin,
    warningMax: sensor.warningMax,
    currentTemp: sensor.currentTemp,
    lastUpdate: sensor.lastUpdate,
    status: sensor.status
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
