import bcrypt from 'bcryptjs'
import { prisma } from '~/server/utils/prisma'
import { generateToken } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: '用户名和密码不能为空'
    })
  }

  const user = await prisma.user.findUnique({
    where: { username },
    include: { role: true }
  })

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  if (user.status !== 'active') {
    throw createError({
      statusCode: 403,
      statusMessage: '账户已被禁用，请联系管理员'
    })
  }

  const isValid = bcrypt.compareSync(password, user.password)
  if (!isValid) {
    throw createError({
      statusCode: 401,
      statusMessage: '用户名或密码错误'
    })
  }

  const config = useRuntimeConfig()
  const token = await generateToken(
    { userId: user.id, roleId: user.roleId },
    config.jwtSecret,
    config.jwtExpiresIn
  )

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  })

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
    data: {
      token,
      user: userInfo
    },
    message: '登录成功'
  }
})
