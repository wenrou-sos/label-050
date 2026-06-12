import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '传感器ID不能为空'
    })
  }

  const sensor = await prisma.sensor.findUnique({
    where: { id },
    include: {
      location: { select: { id: true, name: true, type: true, address: true } },
      goods: { select: { id: true, name: true, type: true, minTemp: true, maxTemp: true } }
    }
  })

  if (!sensor) {
    throw createError({
      statusCode: 404,
      statusMessage: '传感器不存在'
    })
  }

  const recentRecords = await prisma.temperatureRecord.findMany({
    where: { sensorId: id },
    orderBy: { recordTime: 'desc' },
    take: 20
  })

  const data = {
    id: sensor.id,
    name: sensor.name,
    code: sensor.code,
    sensorType: sensor.sensorType,
    locationId: sensor.locationId,
    locationName: sensor.location?.name,
    locationType: sensor.location?.type,
    locationAddress: sensor.location?.address,
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
    status: sensor.status,
    recentRecords: recentRecords.reverse()
  }

  return {
    success: true,
    data
  }
})
