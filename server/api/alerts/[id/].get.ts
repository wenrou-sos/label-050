import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '告警ID不能为空'
    })
  }

  const alert = await prisma.alert.findUnique({
    where: { id },
    include: {
      sensor: {
        select: {
          id: true, name: true, code: true, warningMin: true, warningMax: true,
          location: { select: { id: true, name: true } }
        }
      },
      createdBy: { select: { id: true, username: true, realName: true, phone: true } },
      workOrders: {
        include: {
          assignee: { select: { id: true, username: true, realName: true } },
          creator: { select: { id: true, username: true, realName: true } }
        }
      }
    }
  })

  if (!alert) {
    throw createError({
      statusCode: 404,
      statusMessage: '告警不存在'
    })
  }

  const recentRecords = await prisma.temperatureRecord.findMany({
    where: { sensorId: alert.sensorId },
    orderBy: { recordTime: 'desc' },
    take: 30
  })

  return {
    success: true,
    data: {
      ...alert,
      recentRecords: recentRecords.reverse()
    }
  }
})
