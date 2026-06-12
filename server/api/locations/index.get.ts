import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined
  const status = query.status as string | undefined

  const where: any = {}
  if (type) {
    where.type = type
  }
  if (status) {
    where.status = status
  }

  const locations = await prisma.location.findMany({
    where,
    orderBy: { id: 'asc' }
  })

  return {
    success: true,
    data: locations
  }
})
