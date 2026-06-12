import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
  console.log('Cleaning database...')

  await prisma.workOrderRecord.deleteMany()
  await prisma.workOrderAttachment.deleteMany()
  await prisma.workOrder.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.alertSubscription.deleteMany()
  await prisma.temperatureRecord.deleteMany()
  await prisma.sensor.deleteMany()
  await prisma.goods.deleteMany()
  await prisma.location.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.complianceReport.deleteMany()
  await prisma.systemLog.deleteMany()

  console.log('Creating roles...')
  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: '系统管理员，拥有所有权限',
      permissions: ['system:manage', 'sensor:manage', 'alert:manage', 'workorder:manage', 'report:view']
    }
  })
  const operatorRole = await prisma.role.create({
    data: {
      name: 'operator',
      description: '操作员，可查看传感器、处理告警和工单',
      permissions: ['sensor:view', 'alert:handle', 'workorder:process', 'report:view']
    }
  })
  const viewerRole = await prisma.role.create({
    data: {
      name: 'viewer',
      description: '查看者，仅可查看数据',
      permissions: ['sensor:view', 'alert:view', 'report:view']
    }
  })

  console.log('Creating users...')
  const hashPwd = (pwd) => bcrypt.hashSync(pwd, 10)

  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@coldchain.com',
      password: hashPwd('admin123'),
      realName: '系统管理员',
      phone: '13800000001',
      roleId: adminRole.id,
      status: 'active'
    }
  })
  const operator = await prisma.user.create({
    data: {
      username: 'operator',
      email: 'operator@coldchain.com',
      password: hashPwd('operator123'),
      realName: '操作员张三',
      phone: '13800000002',
      roleId: operatorRole.id,
      status: 'active'
    }
  })
  const viewer = await prisma.user.create({
    data: {
      username: 'viewer',
      email: 'viewer@coldchain.com',
      password: hashPwd('viewer123'),
      realName: '查看者李四',
      phone: '13800000003',
      roleId: viewerRole.id,
      status: 'active'
    }
  })
  const manager = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@coldchain.com',
      password: hashPwd('manager123'),
      realName: '经理王五',
      phone: '13800000004',
      roleId: adminRole.id,
      status: 'active'
    }
  })

  console.log('Creating locations...')
  const warehouseA = await prisma.location.create({
    data: {
      name: '冷库A',
      code: 'WH-A-001',
      type: 'warehouse',
      description: '主冷库A区，存储疫苗及乳制品',
      address: '上海市浦东新区冷链物流园A栋',
      contactName: '张库管',
      contactPhone: '021-50000001',
      status: 'active'
    }
  })
  const warehouseB = await prisma.location.create({
    data: {
      name: '冷库B',
      code: 'WH-B-001',
      type: 'warehouse',
      description: '冷库B区，存储冷冻食品及生物制品',
      address: '上海市浦东新区冷链物流园B栋',
      contactName: '李库管',
      contactPhone: '021-50000002',
      status: 'active'
    }
  })
  const warehouseC = await prisma.location.create({
    data: {
      name: '冷库C',
      code: 'WH-C-001',
      type: 'warehouse',
      description: '冷库C区，存储生鲜蔬果及冰鲜海鲜',
      address: '上海市浦东新区冷链物流园C栋',
      contactName: '王库管',
      contactPhone: '021-50000003',
      status: 'active'
    }
  })
  const vehicle1 = await prisma.location.create({
    data: {
      name: '运输车1',
      code: 'VH-001',
      type: 'vehicle',
      description: '冷藏运输车1号，负责市区配送',
      contactName: '赵司机',
      contactPhone: '13800000101',
      status: 'active'
    }
  })
  const vehicle2 = await prisma.location.create({
    data: {
      name: '运输车2',
      code: 'VH-002',
      type: 'vehicle',
      description: '冷藏运输车2号，负责长途运输',
      contactName: '钱司机',
      contactPhone: '13800000102',
      status: 'active'
    }
  })

  console.log('Creating goods...')
  const vaccine = await prisma.goods.create({
    data: {
      name: '疫苗',
      code: 'GD-VAC-001',
      type: '生物制品',
      description: '新冠、流感等疫苗，需严格2-8°C储存',
      locationId: warehouseA.id,
      minTemp: 2,
      maxTemp: 8,
      status: 'active'
    }
  })
  const frozenFood = await prisma.goods.create({
    data: {
      name: '冷冻食品',
      code: 'GD-FFD-001',
      type: '食品',
      description: '速冻水饺、汤圆等冷冻食品',
      locationId: warehouseB.id,
      minTemp: -18,
      maxTemp: -15,
      status: 'active'
    }
  })
  const freshProduce = await prisma.goods.create({
    data: {
      name: '生鲜蔬果',
      code: 'GD-FPD-001',
      type: '农产品',
      description: '新鲜蔬菜水果，0-5°C保鲜储存',
      locationId: warehouseC.id,
      minTemp: 0,
      maxTemp: 5,
      status: 'active'
    }
  })
  const dairy = await prisma.goods.create({
    data: {
      name: '乳制品',
      code: 'GD-DRY-001',
      type: '食品',
      description: '牛奶、酸奶等乳制品，2-6°C储存',
      locationId: warehouseA.id,
      minTemp: 2,
      maxTemp: 6,
      status: 'active'
    }
  })
  const bioProducts = await prisma.goods.create({
    data: {
      name: '生物制品',
      code: 'GD-BIO-001',
      type: '生物制品',
      description: '血清、试剂等生物制品，-20~-10°C深冷储存',
      locationId: warehouseB.id,
      minTemp: -20,
      maxTemp: -10,
      status: 'active'
    }
  })
  const seafood = await prisma.goods.create({
    data: {
      name: '冰鲜海鲜',
      code: 'GD-SEA-001',
      type: '水产品',
      description: '冰鲜鱼类、虾蟹等海鲜，-2~4°C储存',
      locationId: warehouseC.id,
      minTemp: -2,
      maxTemp: 4,
      status: 'active'
    }
  })

  console.log('Creating sensors...')
  const sensorConfigs = [
    { name: '温度传感器A-01', code: 'SN-A-001', locationId: warehouseA.id, goodsId: vaccine.id, model: 'TH-PRO-200', manufacturer: '华感科技', warningMin: 2, warningMax: 8 },
    { name: '温度传感器A-02', code: 'SN-A-002', locationId: warehouseA.id, goodsId: dairy.id, model: 'TH-PRO-200', manufacturer: '华感科技', warningMin: 2, warningMax: 6 },
    { name: '温度传感器B-01', code: 'SN-B-001', locationId: warehouseB.id, goodsId: frozenFood.id, model: 'TH-PRO-300', manufacturer: '华感科技', warningMin: -18, warningMax: -15 },
    { name: '温度传感器B-02', code: 'SN-B-002', locationId: warehouseB.id, goodsId: bioProducts.id, model: 'TH-PRO-300', manufacturer: '华感科技', warningMin: -20, warningMax: -10 },
    { name: '温度传感器C-01', code: 'SN-C-001', locationId: warehouseC.id, goodsId: freshProduce.id, model: 'TH-PRO-200', manufacturer: '瑞测仪器', warningMin: 0, warningMax: 5 },
    { name: '温度传感器C-02', code: 'SN-C-002', locationId: warehouseC.id, goodsId: seafood.id, model: 'TH-PRO-200', manufacturer: '瑞测仪器', warningMin: -2, warningMax: 4 },
    { name: '车载传感器V1-01', code: 'SN-V1-001', locationId: vehicle1.id, goodsId: vaccine.id, model: 'TH-VHC-100', manufacturer: '瑞测仪器', warningMin: 2, warningMax: 8 },
    { name: '车载传感器V1-02', code: 'SN-V1-002', locationId: vehicle1.id, goodsId: seafood.id, model: 'TH-VHC-100', manufacturer: '瑞测仪器', warningMin: -2, warningMax: 4 },
    { name: '车载传感器V2-01', code: 'SN-V2-001', locationId: vehicle2.id, goodsId: frozenFood.id, model: 'TH-VHC-100', manufacturer: '华感科技', warningMin: -18, warningMax: -15 },
    { name: '车载传感器V2-02', code: 'SN-V2-002', locationId: vehicle2.id, goodsId: dairy.id, model: 'TH-VHC-100', manufacturer: '华感科技', warningMin: 2, warningMax: 6 }
  ]

  const sensors = []
  for (const config of sensorConfigs) {
    const sensor = await prisma.sensor.create({
      data: {
        ...config,
        sensorType: 'temperature',
        installDate: new Date('2024-01-15'),
        minTemp: config.warningMin - 5,
        maxTemp: config.warningMax + 5,
        currentTemp: Math.round(((config.warningMin + config.warningMax) / 2) * 100) / 100,
        lastUpdate: new Date(),
        status: 'online'
      }
    })
    sensors.push(sensor)
  }

  console.log('Creating temperature records...')
  const temperatureRecords = []
  for (const sensor of sensors) {
    const midTemp = (sensor.warningMin + sensor.warningMax) / 2
    const range = sensor.warningMax - sensor.warningMin

    for (let i = 0; i < 48; i++) {
      const minutesAgo = (47 - i) * 30
      const recordTime = new Date(Date.now() - minutesAgo * 60 * 1000)
      const isAbnormal = Math.random() < 0.12

      let temperature
      if (isAbnormal) {
        if (Math.random() < 0.5) {
          temperature = sensor.warningMax + Math.random() * 3 + 0.5
        } else {
          temperature = sensor.warningMin - Math.random() * 3 - 0.5
        }
      } else {
        temperature = midTemp + (Math.random() - 0.5) * range * 0.6
      }
      temperature = Math.round(temperature * 100) / 100

      temperatureRecords.push({
        sensorId: sensor.id,
        temperature,
        recordTime,
        isAbnormal,
        abnormalType: isAbnormal ? (temperature > sensor.warningMax ? 'high' : 'low') : null,
        locationId: sensor.locationId
      })
    }
  }

  const chunkSize = 500
  for (let i = 0; i < temperatureRecords.length; i += chunkSize) {
    const chunk = temperatureRecords.slice(i, i + chunkSize)
    await prisma.temperatureRecord.createMany({ data: chunk })
  }

  console.log('Creating alerts...')
  const alert1 = await prisma.alert.create({
    data: {
      sensorId: sensors[0].id,
      alertType: 'temperature_high',
      level: 'warning',
      title: '冷库A疫苗区域温度过高',
      content: '温度超出预警上限8°C，当前温度10.5°C，请及时处理',
      temperature: 10.5,
      thresholdMin: sensors[0].warningMin,
      thresholdMax: sensors[0].warningMax,
      status: 'pending',
      notifSys: true,
      notifEmail: true,
      createdById: admin.id
    }
  })
  const alert2 = await prisma.alert.create({
    data: {
      sensorId: sensors[2].id,
      alertType: 'temperature_high',
      level: 'critical',
      title: '冷库B冷冻食品区域温度异常升高',
      content: '温度严重超出预警范围，当前温度-10°C，可能导致食品变质',
      temperature: -10,
      thresholdMin: sensors[2].warningMin,
      thresholdMax: sensors[2].warningMax,
      status: 'handled',
      notifSys: true,
      notifEmail: true,
      notifSms: true,
      createdById: operator.id,
      handledAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  })
  const alert3 = await prisma.alert.create({
    data: {
      sensorId: sensors[6].id,
      alertType: 'temperature_low',
      level: 'warning',
      title: '运输车1疫苗区域温度过低',
      content: '温度低于预警下限2°C，当前温度0.5°C，疫苗可能失效',
      temperature: 0.5,
      thresholdMin: sensors[6].warningMin,
      thresholdMax: sensors[6].warningMax,
      status: 'resolved',
      notifSys: true,
      notifEmail: true,
      createdById: admin.id,
      handledAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  })
  const alert4 = await prisma.alert.create({
    data: {
      sensorId: sensors[5].id,
      alertType: 'temperature_high',
      level: 'warning',
      title: '冷库C海鲜区域温度偏高',
      content: '温度超出预警上限4°C，当前温度6.2°C',
      temperature: 6.2,
      thresholdMin: sensors[5].warningMin,
      thresholdMax: sensors[5].warningMax,
      status: 'pending',
      notifSys: true,
      createdById: operator.id
    }
  })

  console.log('Creating work orders...')
  const workOrder1 = await prisma.workOrder.create({
    data: {
      code: 'WO-20240115-001',
      title: '冷库B冷冻区温控设备检修',
      description: '冷库B冷冻食品区域温度持续异常，需检查制冷机组和温控系统',
      alertId: alert2.id,
      status: 'PROCESSING',
      priority: 'HIGH',
      assigneeId: operator.id,
      creatorId: admin.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  })
  const workOrder2 = await prisma.workOrder.create({
    data: {
      code: 'WO-20240115-002',
      title: '运输车1冷藏系统调试',
      description: '运输车1疫苗运输区域温度偏低，需调试冷藏系统参数',
      alertId: alert3.id,
      status: 'COMPLETED',
      priority: 'URGENT',
      assigneeId: operator.id,
      creatorId: manager.id,
      dueDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
      startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  })
  const workOrder3 = await prisma.workOrder.create({
    data: {
      code: 'WO-20240115-003',
      title: '冷库A疫苗区日常巡检',
      description: '冷库A疫苗区域温度偏高，安排巡检确认设备运行状态',
      alertId: alert1.id,
      status: 'ASSIGNED',
      priority: 'MEDIUM',
      assigneeId: operator.id,
      creatorId: admin.id,
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedAt: new Date(Date.now() - 30 * 60 * 1000)
    }
  })

  console.log('Creating work order records...')
  await prisma.workOrderRecord.createMany({
    data: [
      {
        workOrderId: workOrder1.id,
        userId: admin.id,
        action: 'created',
        content: '创建工单：冷库B冷冻区温控设备检修',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        workOrderId: workOrder1.id,
        userId: operator.id,
        action: 'started',
        content: '开始处理：已到达冷库B，检查制冷机组运行状态',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        workOrderId: workOrder1.id,
        userId: operator.id,
        action: 'updated',
        content: '更新进度：发现制冷机组压缩机异常，已联系维修',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        workOrderId: workOrder2.id,
        userId: manager.id,
        action: 'created',
        content: '创建工单：运输车1冷藏系统调试',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
      },
      {
        workOrderId: workOrder2.id,
        userId: operator.id,
        action: 'started',
        content: '开始处理：已到达运输车1，检查冷藏系统',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      },
      {
        workOrderId: workOrder2.id,
        userId: operator.id,
        action: 'completed',
        content: '完成处理：已调整冷藏系统参数，温度恢复正常范围',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
      },
      {
        workOrderId: workOrder3.id,
        userId: admin.id,
        action: 'created',
        content: '创建工单：冷库A疫苗区日常巡检',
        createdAt: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        workOrderId: workOrder3.id,
        userId: operator.id,
        action: 'assigned',
        content: '接受指派：准备前往冷库A进行巡检',
        createdAt: new Date(Date.now() - 20 * 60 * 1000)
      }
    ]
  })

  console.log('Seed completed successfully!')
  console.log(`Created:
  - 3 roles (admin, operator, viewer)
  - 4 users (admin, operator, viewer, manager)
  - 5 locations (3 warehouses, 2 vehicles)
  - 6 goods items
  - 10 sensors
  - ${temperatureRecords.length} temperature records
  - 4 alerts
  - 3 work orders with 8 records
  `)
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
