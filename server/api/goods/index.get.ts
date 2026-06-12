import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const type = query.type as string | undefined
  const status = query.status as string | undefined

  const where: any = {}
  if (locationId) {
    where.locationId = locationId
  }
  if (type) {
    where.type = type
  }
  if (status) {
    where.status = status
  }

  const goods = await prisma.goods.findMany({
    where,
    include: { location: { select: { id: true, name: true } } },
    orderBy: { id: 'asc' }
  })

  return {
    success: true,
    data: goods
  }
})
