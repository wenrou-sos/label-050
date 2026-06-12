import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const userId = event.context.userId

  if (!userId) {
    throw createError({
      statusCode: 401,
      statusMessage: '未登录'
    })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      statusMessage: '用户不存在'
    })
  }

  const userInfo = {
    id: user.id,
    username: user.username,
    email: user.email,
    realName: user.realName,
    phone: user.phone,
    avatar: user.avatar,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions,
    status: user.status
  }

  return {
    success: true,
    data: userInfo
  }
})
