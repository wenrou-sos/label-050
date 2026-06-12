// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      title: '冷链物流温度监控平台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '冷链物流温度监控与异常预警平台' }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  nitro: {
    plugins: [
      '~/server/plugins/prisma.ts',
      '~/server/plugins/websocket.ts',
      '~/server/plugins/simulation.ts'
    ]
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'cold-chain-monitoring-secret-key-2024',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    databaseUrl: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/cold_chain_db',
    public: {
      apiBase: '/api',
      refreshInterval: 5000
    }
  }
})
