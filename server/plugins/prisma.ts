import { PrismaClient } from '@prisma/client'

export default defineNitroPlugin(() => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  })
  // Store in nitro app context
  const nitroApp = useNitroApp()
  nitroApp.prisma = prisma
})
