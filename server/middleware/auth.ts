import { jwtVerify } from 'jose'

export default defineEventHandler(async (event) => {
  const path = getRequestURL(event).pathname
  if (path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register')) {
    return
  }

  const config = useRuntimeConfig()
  const authHeader = getHeader(event, 'authorization')

  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: '未提供认证令牌' })
  }

  const token = authHeader.substring(7)

  try {
    const secret = new TextEncoder().encode(config.jwtSecret)
    const { payload } = await jwtVerify(token, secret)
    event.context.userId = payload.userId as number
    event.context.roleId = payload.roleId as number
  } catch {
    throw createError({ statusCode: 401, statusMessage: '认证令牌无效或已过期' })
  }
})
