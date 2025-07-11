import { addDays, isSameDay } from "date-fns"

export interface PeriodPrediction {
  possibleDays: Date[]
  predictedDays: Date[]
  isComplete: boolean
  confidence: {
    possible: number
    predicted: number
  }
}

export class PeriodPredictionEngine {
  private targetMinDuration = 3
  private targetMaxDuration = 6
  private defaultDuration = 5

  /**
   * Predict remaining period days based on currently logged days
   * Only shows predictions if current date is included in the logged days
   * @param currentPeriodDays - Array of dates already logged for current period
   * @returns PeriodPrediction object with possible and predicted days
   */
  public predictRemainingDays(currentPeriodDays: Date[]): PeriodPrediction {
    if (currentPeriodDays.length === 0) {
      return {
        possibleDays: [],
        predictedDays: [],
        isComplete: false,
        confidence: { possible: 0, predicted: 0 },
      }
    }

    // Check if current date is included in logged days
    const today = new Date()
    const includesCurrentDate = currentPeriodDays.some(date => 
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    )

    // If current date is not included, don't show predictions
    if (!includesCurrentDate) {
      return {
        possibleDays: [],
        predictedDays: [],
        isComplete: false,
        confidence: { possible: 0, predicted: 0 },
      }
    }

    // Sort days to find the pattern
    const sortedDays = [...currentPeriodDays].sort((a, b) => a.getTime() - b.getTime())
    const loggedDaysCount = sortedDays.length
    const lastDay = sortedDays[sortedDays.length - 1]

    // If 5+ days logged, consider period complete
    if (loggedDaysCount >= 5) {
      return {
        possibleDays: [],
        predictedDays: [],
        isComplete: true,
        confidence: { possible: 0, predicted: 0 },
      }
    }

    const possibleDays: Date[] = []
    const predictedDays: Date[] = []

    // Calculate predictions based on logged days
    if (loggedDaysCount === 1) {
      // 1 day logged → 3 possible + 1 predicted (total 4 more days)
      // Possible: days 2, 3, 4 (85% confidence)
      // Predicted: day 5 (75% confidence)
      for (let i = 1; i <= 3; i++) {
        possibleDays.push(addDays(lastDay, i))
      }
      predictedDays.push(addDays(lastDay, 4))
    } else if (loggedDaysCount === 2) {
      // 2 days logged → 2 possible + 1 predicted (total 3 more days)
      // Possible: days 3, 4 (85% confidence)
      // Predicted: day 5 (75% confidence)
      for (let i = 1; i <= 2; i++) {
        possibleDays.push(addDays(lastDay, i))
      }
      predictedDays.push(addDays(lastDay, 3))
    } else if (loggedDaysCount === 3) {
      // 3 days logged → 2 possible (total 2 more days)
      // Possible: days 4, 5 (85% confidence)
      // No predicted days (period might be complete)
      for (let i = 1; i <= 2; i++) {
        possibleDays.push(addDays(lastDay, i))
      }
    } else if (loggedDaysCount === 4) {
      // 4 days logged → 1 possible (total 1 more day)
      // Possible: day 5 (85% confidence)
      possibleDays.push(addDays(lastDay, 1))
    }

    // Remove any dates that are already logged
    const filteredPossibleDays = possibleDays.filter(
      (date) => !currentPeriodDays.some((loggedDate) => isSameDay(date, loggedDate)),
    )

    const filteredPredictedDays = predictedDays.filter(
      (date) => !currentPeriodDays.some((loggedDate) => isSameDay(date, loggedDate)),
    )

    return {
      possibleDays: filteredPossibleDays,
      predictedDays: filteredPredictedDays,
      isComplete: loggedDaysCount >= 5,
      confidence: {
        possible: 85,
        predicted: 75,
      },
    }
  }

  /**
   * Get prediction summary text for UI display
   */
  public getPredictionSummary(currentPeriodDays: Date[]): string {
    const prediction = this.predictRemainingDays(currentPeriodDays)
    const loggedCount = currentPeriodDays.length

    if (prediction.isComplete) {
      return "Period appears complete (5+ days logged)"
    }

    const totalPredicted = prediction.possibleDays.length + prediction.predictedDays.length

    if (totalPredicted === 0) {
      return "Period may be ending soon"
    }

    const possibleCount = prediction.possibleDays.length
    const predictedCount = prediction.predictedDays.length

    let summary = `${loggedCount} day${loggedCount !== 1 ? "s" : ""} logged. `

    if (possibleCount > 0 && predictedCount > 0) {
      summary += `${possibleCount} more day${possibleCount !== 1 ? "s" : ""} likely, ${predictedCount} possible.`
    } else if (possibleCount > 0) {
      summary += `${possibleCount} more day${possibleCount !== 1 ? "s" : ""} likely.`
    } else if (predictedCount > 0) {
      summary += `${predictedCount} more day${predictedCount !== 1 ? "s" : ""} possible.`
    }

    return summary
  }

  /**
   * Check if a date is a predicted period day
   */
  public isPredictedDay(date: Date, currentPeriodDays: Date[]): "possible" | "predicted" | null {
    const prediction = this.predictRemainingDays(currentPeriodDays)

    if (prediction.possibleDays.some((d) => isSameDay(d, date))) {
      return "possible"
    }

    if (prediction.predictedDays.some((d) => isSameDay(d, date))) {
      return "predicted"
    }

    return null
  }
}

// Export singleton instance
export const periodPredictionEngine = new PeriodPredictionEngine()
