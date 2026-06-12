import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const body = await readBody(event)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '传感器ID不能为空'
    })
  }

  const existing = await prisma.sensor.findUnique({ where: { id } })
  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: '传感器不存在'
    })
  }

  const updateData: any = {}
  const allowedFields = ['name', 'sensorType', 'locationId', 'goodsId', 'model', 'manufacturer', 'installDate', 'minTemp', 'maxTemp', 'warningMin', 'warningMax', 'status']

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'locationId' || field === 'goodsId') {
        updateData[field] = body[field] ? parseInt(body[field]) : null
      } else if (field === 'installDate') {
        updateData[field] = body[field] ? new Date(body[field]) : null
      } else {
        updateData[field] = body[field]
      }
    }
  }

  if (body.code && body.code !== existing.code) {
    const codeExists = await prisma.sensor.findUnique({ where: { code: body.code } })
    if (codeExists) {
      throw createError({
        statusCode: 400,
        statusMessage: '传感器编号已存在'
      })
    }
    updateData.code = body.code
  }

  const sensor = await prisma.sensor.update({
    where: { id },
    data: updateData,
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
    message: '传感器更新成功'
  }
})
