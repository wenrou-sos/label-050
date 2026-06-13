export interface PredictionPoint {
  timestamp: Date
  value: number
  lower: number
  upper: number
  isAbnormal: boolean
}

export interface PredictionResult {
  labels: string[]
  predicted: number[]
  lowerBound: number[]
  upperBound: number[]
  warningPoints: { label: string; value: number }[]
  method: string
  rSquared: number
  lastRecordTime: string
  lastTemperature: number
}

const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

const mean = (arr: number[]): number => {
  if (arr.length === 0) return 0
  return sum(arr) / arr.length
}

const variance = (arr: number[]): number => {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return sum(arr.map(x => (x - m) ** 2)) / (arr.length - 1)
}

const stdDev = (arr: number[]): number => Math.sqrt(variance(arr))

export const linearRegression = (x: number[], y: number[]) => {
  const n = x.length
  if (n < 2) {
    return { slope: 0, intercept: y[0] || 0, rSquared: 0, stdError: 0 }
  }

  const sumX = sum(x)
  const sumY = sum(y)
  const sumXY = sum(x.map((xi, i) => xi * y[i]))
  const sumXX = sum(x.map(xi => xi * xi))

  const denominator = n * sumXX - sumX * sumX
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
  const intercept = (sumY - slope * sumX) / n

  const yMean = mean(y)
  const ssTotal = sum(y.map(yi => (yi - yMean) ** 2))
  const ssResidual = sum(y.map((yi, i) => (yi - (slope * x[i] + intercept)) ** 2))
  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0

  const stdError = n > 2 ? Math.sqrt(ssResidual / (n - 2)) : 0

  return { slope, intercept, rSquared, stdError }
}

export const simpleMovingAverage = (values: number[], window: number): number[] => {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1)
    const windowVals = values.slice(start, i + 1)
    result.push(mean(windowVals))
  }
  return result
}

export const predictTemperature = (
  records: { recordTime: Date; temperature: number }[],
  options: {
    steps?: number
    stepIntervalSec?: number
    warningMin?: number
    warningMax?: number
    method?: 'sma' | 'linear' | 'auto'
  } = {}
): PredictionResult => {
  const {
    steps = 12,
    stepIntervalSec = 300,
    warningMin = -25,
    warningMax = 4,
    method = 'auto'
  } = options

  const emptyResult: PredictionResult = {
    labels: [],
    predicted: [],
    lowerBound: [],
    upperBound: [],
    warningPoints: [],
    method: 'none',
    rSquared: 0,
    lastRecordTime: '',
    lastTemperature: 0
  }

  if (records.length < 5) {
    return emptyResult
  }

  const sorted = [...records].sort((a, b) => a.recordTime.getTime() - b.recordTime.getTime())
  const temps = sorted.map(r => r.temperature)
  const times = sorted.map(r => r.recordTime.getTime())

  const lastTime = times[times.length - 1]
  const lastTemp = temps[temps.length - 1]

  const xIndices = temps.map((_, i) => i)

  const lr = linearRegression(xIndices, temps)
  const smaWindow = Math.min(5, temps.length)
  const sma = simpleMovingAverage(temps, smaWindow)
  const lastSMA = sma[sma.length - 1]

  let useMethod: 'sma' | 'linear'
  if (method === 'auto') {
    useMethod = Math.abs(lr.rSquared) > 0.6 ? 'linear' : 'sma'
  } else {
    useMethod = method
  }

  const labels: string[] = []
  const predicted: number[] = []
  const lowerBound: number[] = []
  const upperBound: number[] = []
  const warningPoints: { label: string; value: number }[] = []

  const residuals = temps.map((t, i) => t - (lr.slope * i + lr.intercept))
  const noiseStd = stdDev(residuals) || stdDev(temps) * 0.3 || 0.5
  const zScore = 1.96

  for (let i = 1; i <= steps; i++) {
    const futureTime = new Date(lastTime + i * stepIntervalSec * 1000)
    const label = futureTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    labels.push(label)

    let predValue: number

    if (useMethod === 'linear') {
      predValue = lastTemp + lr.slope * i
    } else {
      const decay = Math.exp(-i / (steps * 1.5))
      const trend = lr.slope * i * decay
      predValue = lastTemp + trend
    }

    const uncertaintyGrowth = Math.sqrt(1 + (i * i) / temps.length)
    const ci = zScore * noiseStd * uncertaintyGrowth
    const lower = predValue - ci
    const upper = predValue + ci

    predicted.push(Number(predValue.toFixed(2)))
    lowerBound.push(Number(lower.toFixed(2)))
    upperBound.push(Number(upper.toFixed(2)))

    if (predValue < warningMin || predValue > warningMax) {
      warningPoints.push({ label, value: Number(predValue.toFixed(2)) })
    }
  }

  return {
    labels,
    predicted,
    lowerBound,
    upperBound,
    warningPoints,
    method: useMethod,
    rSquared: Number(lr.rSquared.toFixed(4)),
    lastRecordTime: new Date(lastTime).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    lastTemperature: Number(lastTemp.toFixed(2))
  }
}
