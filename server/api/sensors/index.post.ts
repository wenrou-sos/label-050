import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { name, code, sensorType, locationId, goodsId, model, manufacturer, installDate, minTemp, maxTemp, warningMin, warningMax, status } = body

  if (!name || !code || !locationId) {
    throw createError({
      statusCode: 400,
      statusMessage: '名称、编号和位置不能为空'
    })
  }

  const existing = await prisma.sensor.findUnique({ where: { code } })
  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: '传感器编号已存在'
    })
  }

  const sensor = await prisma.sensor.create({
    data: {
      name,
      code,
      sensorType: sensorType || 'temperature',
      locationId: parseInt(locationId),
      goodsId: goodsId ? parseInt(goodsId) : null,
      model,
      manufacturer,
      installDate: installDate ? new Date(installDate) : null,
      minTemp: minTemp ?? -30,
      maxTemp: maxTemp ?? 10,
      warningMin: warningMin ?? -25,
      warningMax: warningMax ?? 4,
      status: status || 'online'
    },
    include: {
      location: { select: { id: true, name: true } },
      goods: { select: { id: true, name: true } }
    }
  })

  return {
    success: true,
    data: {
      id: sensor.id,
      name: sensor.name,
      code: sensor.code,
      locationName: sensor.location?.name,
      goodsName: sensor.goods?.name,
      status: sensor.status
    },
    message: '传感器创建成功'
  }
})
