import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

let simulationInterval: ReturnType<typeof setInterval> | null = null

async function simulateTemperatureData() {
  try {
    const sensors = await prisma.sensor.findMany({
      where: { status: 'online' },
      select: { id: true, warningMin: true, warningMax: true, locationId: true }
    })

    for (const sensor of sensors) {
      const midTemp = (sensor.warningMin + sensor.warningMax) / 2
      const range = sensor.warningMax - sensor.warningMin
      const isAbnormal = Math.random() < 0.1
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
          locationId: sensor.locationId
        }
      })

      await prisma.sensor.update({
        where: { id: sensor.id },
        data: { currentTemp: temperature, lastUpdate: new Date() }
      })

      if (isAbnormal) {
        const alertLevel = (temperature > sensor.warningMax + 3 || temperature < sensor.warningMin - 3) ? 'critical' : 'warning'
        const sensorInfo = await prisma.sensor.findUnique({
          where: { id: sensor.id },
          select: { name: true }
        })
        await prisma.alert.create({
          data: {
            sensorId: sensor.id,
            alertType: temperature > sensor.warningMax ? 'temperature_high' : 'temperature_low',
            level: alertLevel,
            title: `${sensorInfo?.name || '传感器'}温度${temperature > sensor.warningMax ? '过高' : '过低'}`,
            content: `当前温度${temperature}°C，超出预警范围${sensor.warningMin}°C~${sensor.warningMax}°C`,
            temperature,
            thresholdMin: sensor.warningMin,
            thresholdMax: sensor.warningMax,
            status: 'pending',
            notifSys: true,
            createdById: 1
          }
        })
      }
    }
  } catch (e) {
    console.error('Temperature simulation error:', e)
  }
}

export default defineNitroPlugin(() => {
  simulationInterval = setInterval(simulateTemperatureData, 5000)

  console.log('Temperature simulation cron started (5s interval)')
})
