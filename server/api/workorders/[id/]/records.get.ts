import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: '工单ID不能为空'
    })
  }

  const [records, total] = await Promise.all([
    prisma.workOrderRecord.findMany({
      where: { workOrderId: id },
      include: { user: { select: { id: true, username: true, realName: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.workOrderRecord.count({ where: { workOrderId: id } })
  ])

  return {
    success: true,
    data: records,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  }
})
