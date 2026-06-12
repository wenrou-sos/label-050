import type { NitroApp } from 'nitropack'
import { EventEmitter } from 'events'

interface RealtimeEvents {
  'temperature:update': (data: { sensorId: number; temperature: number; humidity?: number; recordTime: string }) => void
  'alert:new': (data: { alertId: number; sensorId: number; level: string; title: string }) => void
  'alert:status': (data: { alertId: number; status: string }) => void
  'sensor:status': (data: { sensorId: number; status: string }) => void
  'workorder:update': (data: { workOrderId: number; status: string }) => void
}

declare module 'nitropack' {
  interface NitroApp {
    emitter: EventEmitter
  }
}

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(100)
  nitroApp.emitter = emitter
})
