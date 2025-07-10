import { addDays, differenceInDays, subDays } from "date-fns"

export interface PeriodLog {
  startDate: Date
  endDate: Date
  days: Date[]
}

export interface CycleAnalysis {
  averageCycleLength: number
  averagePeriodLength: number
  cycleVariation: number
  regularityScore: number
  totalCycles: number
  recentCycles: number
}

export interface PredictionData {
  nextPeriod: {
    startDate: Date
    predictedDays: Date[]
    possibleDays: Date[]
    confidence: number
  }
  ovulation: {
    date: Date
    fertileWindow: Date[]
    confidence: number
  }
  futureCycles: Array<{
    startDate: Date
    endDate: Date
    confidence: number
    cycleNumber: number
  }>
  analysis: CycleAnalysis
}

export class CyclePredictionEngine {
  private periodHistory: PeriodLog[]

  constructor(periodHistory: PeriodLog[]) {
    this.periodHistory = [...periodHistory].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }

  // Calculate cycle lengths between consecutive periods
  private calculateCycleLengths(): number[] {
    if (this.periodHistory.length < 2) return []

    const cycleLengths: number[] = []
    for (let i = 1; i < this.periodHistory.length; i++) {
      const cycleLength = differenceInDays(this.periodHistory[i].startDate, this.periodHistory[i - 1].startDate)
      cycleLengths.push(cycleLength)
    }
    return cycleLengths
  }

  // Calculate period lengths
  private calculatePeriodLengths(): number[] {
    return this.periodHistory.map((log) => differenceInDays(log.endDate, log.startDate) + 1)
  }

  // Calculate weighted average (recent cycles weighted more heavily)
  private calculateWeightedAverage(values: number[], maxValues = 6): number {
    if (values.length === 0) return 0

    const recentValues = values.slice(-maxValues)
    let weightedSum = 0
    let totalWeight = 0

    recentValues.forEach((value, index) => {
      const weight = index + 1 // More recent = higher weight
      weightedSum += value * weight
      totalWeight += weight
    })

    return weightedSum / totalWeight
  }

  // Calculate standard deviation
  private calculateStandardDeviation(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2))
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
    return Math.sqrt(variance)
  }

  // Analyze cycle patterns
  public analyzeCycles(): CycleAnalysis {
    const cycleLengths = this.calculateCycleLengths()
    const periodLengths = this.calculatePeriodLengths()

    const averageCycleLength = cycleLengths.length > 0 ? this.calculateWeightedAverage(cycleLengths) : 28 // Default cycle length

    const averagePeriodLength = periodLengths.length > 0 ? this.calculateWeightedAverage(periodLengths) : 5 // Default period length

    const recentCycles = cycleLengths.slice(-6)
    const cycleVariation = this.calculateStandardDeviation(recentCycles)

    // Regularity score: 100 - (variation × 8), clamped to 0-100
    const regularityScore = Math.max(0, Math.min(100, 100 - cycleVariation * 8))

    return {
      averageCycleLength: Math.round(averageCycleLength),
      averagePeriodLength: Math.round(averagePeriodLength),
      cycleVariation: Math.round(cycleVariation * 10) / 10,
      regularityScore: Math.round(regularityScore),
      totalCycles: cycleLengths.length,
      recentCycles: recentCycles.length,
    }
  }

  // Calculate base confidence based on data quality
  private calculateBaseConfidence(analysis: CycleAnalysis): number {
    let confidence = 50 // Base confidence

    // Increase confidence based on number of cycles
    if (analysis.totalCycles >= 6) confidence += 25
    else if (analysis.totalCycles >= 3) confidence += 15
    else if (analysis.totalCycles >= 1) confidence += 10

    // Adjust based on regularity
    confidence += (analysis.regularityScore / 100) * 20

    // Recent data bonus
    if (analysis.recentCycles >= 3) confidence += 10

    return Math.min(95, Math.max(30, confidence))
  }

  // Predict next period with confidence scoring
  private predictNextPeriod(analysis: CycleAnalysis): PredictionData["nextPeriod"] {
    if (this.periodHistory.length === 0) {
      throw new Error("No period history available for predictions")
    }

    const lastPeriod = this.periodHistory[this.periodHistory.length - 1]
    const baseConfidence = this.calculateBaseConfidence(analysis)

    // Calculate next start date with variation
    const variationDays = Math.ceil(analysis.cycleVariation / 2)
    const nextStartDate = addDays(lastPeriod.startDate, analysis.averageCycleLength)

    // Generate predicted days (most likely period days)
    const predictedDays: Date[] = []
    for (let i = 0; i < analysis.averagePeriodLength; i++) {
      predictedDays.push(addDays(nextStartDate, i))
    }

    // Generate possible days (wider range including variation)
    const possibleDays: Date[] = []
    const startRange = subDays(nextStartDate, variationDays)
    const endRange = addDays(nextStartDate, variationDays + analysis.averagePeriodLength)

    let currentDate = startRange
    while (currentDate <= endRange) {
      possibleDays.push(new Date(currentDate))
      currentDate = addDays(currentDate, 1)
    }

    return {
      startDate: nextStartDate,
      predictedDays,
      possibleDays,
      confidence: Math.round(baseConfidence * 0.85), // 85% of base confidence for period prediction
    }
  }

  // Predict ovulation and fertile window
  private predictOvulation(nextPeriodStart: Date, analysis: CycleAnalysis): PredictionData["ovulation"] {
    const baseConfidence = this.calculateBaseConfidence(analysis)

    // Adjust luteal phase for irregular cycles (13-16 days)
    let lutealPhase = 14
    if (analysis.regularityScore < 70) {
      lutealPhase = 13 + Math.random() * 3 // Random between 13-16 for irregular cycles
    }

    const ovulationDate = subDays(nextPeriodStart, Math.round(lutealPhase))

    // Fertile window: 5 days before ovulation + ovulation day + 1 day after
    const fertileWindow: Date[] = []
    for (let i = -5; i <= 1; i++) {
      fertileWindow.push(addDays(ovulationDate, i))
    }

    return {
      date: ovulationDate,
      fertileWindow,
      confidence: Math.round(baseConfidence * 0.8), // 80% of base confidence for ovulation
    }
  }

  // Predict future cycles (next 6 months)
  private predictFutureCycles(analysis: CycleAnalysis): PredictionData["futureCycles"] {
    if (this.periodHistory.length === 0) return []

    const futureCycles: PredictionData["futureCycles"] = []
    const baseConfidence = this.calculateBaseConfidence(analysis)
    let currentStartDate = addDays(
      this.periodHistory[this.periodHistory.length - 1].startDate,
      analysis.averageCycleLength,
    )

    for (let i = 0; i < 6; i++) {
      // Decrease confidence by 5% per month, minimum 70%
      const confidence = Math.max(70, baseConfidence - i * 5)

      const endDate = addDays(currentStartDate, analysis.averagePeriodLength - 1)

      futureCycles.push({
        startDate: new Date(currentStartDate),
        endDate: new Date(endDate),
        confidence: Math.round(confidence * 0.75), // 75% base confidence for future predictions
        cycleNumber: i + 1,
      })

      currentStartDate = addDays(currentStartDate, analysis.averageCycleLength)
    }

    return futureCycles
  }

  // Main prediction method
  public generatePredictions(): PredictionData {
    if (this.periodHistory.length === 0) {
      throw new Error("Insufficient data for predictions. Please log at least one period.")
    }

    const analysis = this.analyzeCycles()
    const nextPeriod = this.predictNextPeriod(analysis)
    const ovulation = this.predictOvulation(nextPeriod.startDate, analysis)
    const futureCycles = this.predictFutureCycles(analysis)

    return {
      nextPeriod,
      ovulation,
      futureCycles,
      analysis,
    }
  }

  // Check if cycle appears unusually irregular
  public isUnusuallyIrregular(): boolean {
    const analysis = this.analyzeCycles()
    return analysis.regularityScore < 50 && analysis.totalCycles >= 3
  }

  // Get cycle insights and warnings
  public getCycleInsights(): string[] {
    const insights: string[] = []
    const analysis = this.analyzeCycles()

    if (analysis.totalCycles < 3) {
      insights.push("Log more cycles for more accurate predictions")
    }

    if (analysis.regularityScore >= 80) {
      insights.push("Your cycles are very regular")
    } else if (analysis.regularityScore >= 60) {
      insights.push("Your cycles are moderately regular")
    } else if (analysis.regularityScore >= 40) {
      insights.push("Your cycles show some irregularity")
    } else {
      insights.push("Your cycles are quite irregular - consider consulting a healthcare provider")
    }

    if (analysis.averageCycleLength < 21) {
      insights.push("Your cycles are shorter than average")
    } else if (analysis.averageCycleLength > 35) {
      insights.push("Your cycles are longer than average")
    }

    if (analysis.averagePeriodLength > 7) {
      insights.push("Your periods are longer than average")
    } else if (analysis.averagePeriodLength < 3) {
      insights.push("Your periods are shorter than average")
    }

    return insights
  }
}

// Hook for using cycle predictions in React components
export function useCyclePredictions(periodHistory: PeriodLog[]) {
  try {
    const engine = new CyclePredictionEngine(periodHistory)
    const predictions = engine.generatePredictions()
    const insights = engine.getCycleInsights()
    const isIrregular = engine.isUnusuallyIrregular()

    return {
      predictions,
      insights,
      isIrregular,
      error: null,
    }
  } catch (error) {
    return {
      predictions: null,
      insights: [],
      isIrregular: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
