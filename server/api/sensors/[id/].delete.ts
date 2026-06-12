import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)

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

  await prisma.sensor.delete({ where: { id } })

  return {
    success: true,
    message: '传感器删除成功'
  }
})
