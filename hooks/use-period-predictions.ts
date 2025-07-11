"use client"

import { useMemo } from "react"
import { addDays, differenceInDays, isSameDay, startOfDay } from "date-fns"
import type { PeriodLog, CycleStats, PeriodPredictions } from "./use-period-data"

export function usePeriodPredictions(
  periodHistory: PeriodLog[],
  selectedDates: Date[],
  isLogging: boolean,
  cycleStats: CycleStats
): PeriodPredictions {
  return useMemo(() => {
    const today = startOfDay(new Date())
    
    // Initialize empty predictions
    let possibleDays: Date[] = []
    let predictedDays: Date[] = []
    const futurePeriods: Array<{ startDate: Date; days: Date[]; cycleNumber: number }> = []
    const ovulationDates: Date[] = []
    const fertileWindows: Date[] = []

    // 1. Calculate current period predictions (possible and predicted days)
    if (isLogging && selectedDates.length > 0) {
      // Only show predictions if today is included in selected dates
      const includesCurrentDate = selectedDates.some(date => isSameDay(date, today))
      
      if (includesCurrentDate && selectedDates.length < 5) {
        const targetPeriodLength = cycleStats.averagePeriodLength
        const daysLogged = selectedDates.length
        const remainingDays = Math.max(0, targetPeriodLength - daysLogged)
        
        if (remainingDays > 0) {
          const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
          const lastDay = sortedDates[sortedDates.length - 1]
          
          // First up to 3 days are "possible" (85% confidence)
          const possibleCount = Math.min(3, remainingDays)
          for (let i = 1; i <= possibleCount; i++) {
            const nextDay = addDays(lastDay, i)
            if (!selectedDates.some(date => isSameDay(date, nextDay))) {
              possibleDays.push(nextDay)
            }
          }
          
          // Remaining days are "predicted" (75% confidence)
          if (remainingDays > possibleCount) {
            const predictedCount = remainingDays - possibleCount
            for (let i = possibleCount + 1; i <= possibleCount + predictedCount; i++) {
              const nextDay = addDays(lastDay, i)
              if (!selectedDates.some(date => isSameDay(date, nextDay))) {
                predictedDays.push(nextDay)
              }
            }
          }
        }
      }
    }

    // 2. Calculate future periods, ovulation, and fertile windows
    if (periodHistory.length > 0) {
      const lastPeriod = periodHistory[periodHistory.length - 1]
      let currentPeriodStart = addDays(lastPeriod.startDate, cycleStats.averageCycleLength)
      
      // Generate next 6 cycles
      for (let cycle = 1; cycle <= 6; cycle++) {
        // Add some variation to cycle length
        const variation = Math.random() * cycleStats.cycleVariation - (cycleStats.cycleVariation / 2)
        const adjustedCycleStart = addDays(currentPeriodStart, Math.round(variation))
        
        // Generate future period days
        const periodDays: Date[] = []
        for (let day = 0; day < cycleStats.averagePeriodLength; day++) {
          periodDays.push(addDays(adjustedCycleStart, day))
        }
        
        futurePeriods.push({
          startDate: adjustedCycleStart,
          days: periodDays,
          cycleNumber: cycle,
        })
        
        // Calculate ovulation (14 days before next period)
        const lutealPhaseLength = 14
        const ovulationDate = addDays(adjustedCycleStart, -lutealPhaseLength)
        ovulationDates.push(ovulationDate)
        
        // Calculate fertile window (5 days before ovulation + ovulation day + 1 day after)
        for (let i = -5; i <= 1; i++) {
          fertileWindows.push(addDays(ovulationDate, i))
        }
        
        // Move to next cycle
        currentPeriodStart = addDays(adjustedCycleStart, cycleStats.averageCycleLength)
      }
    }

    return {
      possibleDays,
      predictedDays,
      futurePeriods,
      ovulationDates,
      fertileWindows,
    }
  }, [periodHistory, selectedDates, isLogging, cycleStats])
}