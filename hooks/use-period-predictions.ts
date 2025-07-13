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
    // Check if we have an ongoing period that includes today
    const hasOngoingPeriod = () => {
      if (isLogging && selectedDates.length > 0) {
        return selectedDates.some(date => isSameDay(date, today))
      }
      
      // Check if today is part of any logged period
      return periodHistory.some(period => 
        period.days.some(day => isSameDay(day, today))
      )
    }
    
    if (hasOngoingPeriod()) {
      // Get current period data (either from logging or from history)
      let currentPeriodDays: Date[] = []
      
      if (isLogging && selectedDates.length > 0) {
        currentPeriodDays = selectedDates
      } else {
        // Find the period that includes today
        const todaysPeriod = periodHistory.find(period => 
          period.days.some(day => isSameDay(day, today))
        )
        if (todaysPeriod) {
          currentPeriodDays = todaysPeriod.days
        }
      }
      
      if (currentPeriodDays.length > 0 && currentPeriodDays.length < 5) {
        const targetPeriodLength = cycleStats.averagePeriodLength
        const daysLogged = currentPeriodDays.length
        const remainingDays = Math.max(0, targetPeriodLength - daysLogged)
        
        if (remainingDays > 0) {
          const sortedDates = [...currentPeriodDays].sort((a, b) => a.getTime() - b.getTime())
          const lastDay = sortedDates[sortedDates.length - 1]
          
          // First up to 3 days are "possible" (85% confidence)
          const possibleCount = Math.min(3, remainingDays)
          for (let i = 1; i <= possibleCount; i++) {
            const nextDay = addDays(lastDay, i)
            if (!currentPeriodDays.some(date => isSameDay(date, nextDay))) {
              possibleDays.push(nextDay)
            }
          }
          
          // Remaining days are "predicted" (75% confidence)
          if (remainingDays > possibleCount) {
            const predictedCount = remainingDays - possibleCount
            for (let i = possibleCount + 1; i <= possibleCount + predictedCount; i++) {
              const nextDay = addDays(lastDay, i)
              if (!currentPeriodDays.some(date => isSameDay(date, nextDay))) {
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