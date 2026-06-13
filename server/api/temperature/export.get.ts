import { prisma } from '~/server/utils/prisma'
import { createObjectCsvWriter } from 'csv-writer'
import ExcelJS from 'exceljs'
import { tmpdir } from 'os'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sensorId = query.sensorId ? parseInt(query.sensorId as string) : undefined
  const locationId = query.locationId ? parseInt(query.locationId as string) : undefined
  const startTime = query.startTime as string | undefined
  const endTime = query.endTime as string | undefined
  const format = (query.format as string) || 'csv'

  const where: any = {}
  if (sensorId) where.sensorId = sensorId
  if (locationId) where.locationId = locationId
  if (startTime) where.recordTime = { ...where.recordTime, gte: new Date(startTime) }
  if (endTime) where.recordTime = { ...where.recordTime, lte: new Date(endTime) }

  const records = await prisma.temperatureRecord.findMany({
    where,
    include: {
      sensor: {
        select: {
          name: true,
          code: true,
          location: { select: { name: true } }
        }
      }
    },
    orderBy: { recordTime: 'asc' },
    take: 10000
  })

  if (format === 'csv') {
    const csvData = records.map(r => ({
      id: r.id.toString(),
      sensorCode: r.sensor?.code || '',
      sensorName: r.sensor?.name || '',
      locationName: r.sensor?.location?.name || '',
      temperature: r.temperature.toString(),
      humidity: r.humidity?.toString() || '',
      recordTime: r.recordTime.toISOString(),
      isAbnormal: r.isAbnormal ? '是' : '否',
      abnormalType: r.abnormalType || ''
    }))

    const headers = [
      { id: 'id', title: '记录ID' },
      { id: 'sensorCode', title: '传感器编号' },
      { id: 'sensorName', title: '传感器名称' },
      { id: 'locationName', title: '位置' },
      { id: 'temperature', title: '温度(°C)' },
      { id: 'humidity', title: '湿度(%)' },
      { id: 'recordTime', title: '记录时间' },
      { id: 'isAbnormal', title: '是否异常' },
      { id: 'abnormalType', title: '异常类型' }
    ]

    const filePath = join(tmpdir(), `temp_export_${Date.now()}.csv`)
    const csvWriter = createObjectCsvWriter({ path: filePath, header: headers })
    await csvWriter.writeRecords(csvData)

    const fs = await import('fs')
    const content = fs.readFileSync(filePath, 'utf-8')
    fs.unlinkSync(filePath)

    setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="temperature_records_${Date.now()}.csv"`)

    return '\uFEFF' + content
  }

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook()
    workbook.creator = '冷链物流温度监控平台'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('温度记录')
    sheet.columns = [
      { header: '记录ID', key: 'id', width: 15 },
      { header: '传感器编号', key: 'sensorCode', width: 18 },
      { header: '传感器名称', key: 'sensorName', width: 20 },
      { header: '位置', key: 'locationName', width: 20 },
      { header: '温度(°C)', key: 'temperature', width: 12 },
      { header: '湿度(%)', key: 'humidity', width: 12 },
      { header: '记录时间', key: 'recordTime', width: 22 },
      { header: '是否异常', key: 'isAbnormal', width: 10 },
      { header: '异常类型', key: 'abnormalType', width: 12 }
    ]

    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }

    for (const r of records) {
      const row = sheet.addRow({
        id: r.id.toString(),
        sensorCode: r.sensor?.code || '',
        sensorName: r.sensor?.name || '',
        locationName: r.sensor?.location?.name || '',
        temperature: r.temperature,
        humidity: r.humidity || '',
        recordTime: r.recordTime.toISOString(),
        isAbnormal: r.isAbnormal ? '是' : '否',
        abnormalType: r.abnormalType || ''
      })

      if (r.isAbnormal) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCCCC' }
          }
        })
      }
    }

    const filePath = join(tmpdir(), `temp_export_${Date.now()}.xlsx`)
    await workbook.xlsx.writeFile(filePath)

    const fs = await import('fs')
    const buffer = fs.readFileSync(filePath)
    fs.unlinkSync(filePath)

    setHeader(event, 'Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    setHeader(event, 'Content-Disposition', `attachment; filename="temperature_records_${Date.now()}.xlsx"`)

    return buffer
  }

  return {
    success: true,
    data: records
  }
})
