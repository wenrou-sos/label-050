import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const roleId = query.roleId ? parseInt(query.roleId as string) : undefined
  const status = query.status as string | undefined

  const where: any = {}
  if (roleId) {
    where.roleId = roleId
  }
  if (status) {
    where.status = status
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      username: true,
      email: true,
      realName: true,
      phone: true,
      roleId: true,
      status: true,
      role: { select: { id: true, name: true, description: true } }
    },
    orderBy: { id: 'asc' }
  })

  return {
    success: true,
    data: users
  }
})
