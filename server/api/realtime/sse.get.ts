import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const sendUpdates = async () => {
    try {
      const sensors = await prisma.sensor.findMany({
        where: { status: 'online' },
        select: { id: true, currentTemp: true, warningMin: true, warningMax: true }
      })

      for (const sensor of sensors) {
        const midTemp = (sensor.warningMin + sensor.warningMax) / 2
        const range = sensor.warningMax - sensor.warningMin
        const isAbnormal = Math.random() < 0.08
        let temperature: number
        if (isAbnormal) {
          temperature = Math.random() < 0.5
            ? sensor.warningMax + Math.random() * 2 + 0.5
            : sensor.warningMin - Math.random() * 2 - 0.5
        } else {
          temperature = midTemp + (Math.random() - 0.5) * range * 0.6
        }
        temperature = Math.round(temperature * 100) / 100

        await prisma.temperatureRecord.create({
          data: {
            sensorId: sensor.id,
            temperature,
            recordTime: new Date(),
            isAbnormal,
            abnormalType: isAbnormal ? (temperature > sensor.warningMax ? 'high' : 'low') : null,
            locationId: (await prisma.sensor.findUnique({ where: { id: sensor.id }, select: { locationId: true } }))?.locationId
          }
        })

        await prisma.sensor.update({
          where: { id: sensor.id },
          data: { currentTemp: temperature, lastUpdate: new Date() }
        })

        if (isAbnormal) {
          const admin = await prisma.user.findFirst({ where: { roleId: 1 } })
          const alertLevel = temperature > sensor.warningMax + 3 || temperature < sensor.warningMin - 3 ? 'critical' : 'warning'
          await prisma.alert.create({
            data: {
              sensorId: sensor.id,
              alertType: temperature > sensor.warningMax ? 'temperature_high' : 'temperature_low',
              level: alertLevel,
              title: `传感器ID${sensor.id}温度${temperature > sensor.warningMax ? '过高' : '过低'}`,
              content: `当前温度${temperature}°C，超出预警范围${sensor.warningMin}°C~${sensor.warningMax}°C`,
              temperature,
              thresholdMin: sensor.warningMin,
              thresholdMax: sensor.warningMax,
              status: 'pending',
              notifSys: true,
              createdById: admin?.id || 1
            }
          })
        }

        eventStream.push({
          event: 'temperature',
          data: JSON.stringify({ sensorId: sensor.id, temperature, isAbnormal })
        })
      }
    } catch (e) {
      console.error('SSE update error:', e)
    }
  }

  const pingInterval = setInterval(() => {
    eventStream.push({
      event: 'ping',
      data: JSON.stringify({ timestamp: new Date().toISOString() })
    })
  }, 15000)

  const dataInterval = setInterval(sendUpdates, 5000)

  eventStream.onClosed(() => {
    clearInterval(pingInterval)
    clearInterval(dataInterval)
  })

  return eventStream.send()
})
