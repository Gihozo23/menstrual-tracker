"use client"

import { useState, useEffect, useMemo } from "react"
import { addDays, differenceInDays, isSameDay, startOfDay, isFuture } from "date-fns"

export interface PeriodLog {
  startDate: Date
  endDate: Date
  days: Date[]
}

export interface CycleStats {
  averageCycleLength: number
  averagePeriodLength: number
  cycleVariation: number
  totalCycles: number
}

export interface PeriodPredictions {
  possibleDays: Date[]
  predictedDays: Date[]
  futurePeriods: Array<{
    startDate: Date
    days: Date[]
    cycleNumber: number
  }>
  ovulationDates: Date[]
  fertileWindows: Date[]
}

export function usePeriodData() {
  const [periodHistory, setPeriodHistory] = useState<PeriodLog[]>([])
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isLogging, setIsLogging] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("periodHistory")
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory)
      const historyWithDates = parsed.map((log: any) => ({
        ...log,
        startDate: new Date(log.startDate),
        endDate: new Date(log.endDate),
        days: log.days.map((day: string) => new Date(day)),
      }))
      setPeriodHistory(historyWithDates)
    }
  }, [])

  // Save to localStorage whenever periodHistory changes
  useEffect(() => {
    localStorage.setItem("periodHistory", JSON.stringify(periodHistory))
  }, [periodHistory])

  // Calculate cycle statistics
  const cycleStats = useMemo((): CycleStats => {
    if (periodHistory.length < 2) {
      return {
        averageCycleLength: 28,
        averagePeriodLength: 5,
        cycleVariation: 2,
        totalCycles: 0,
      }
    }

    // Calculate cycle lengths
    const cycleLengths: number[] = []
    for (let i = 1; i < periodHistory.length; i++) {
      const cycleLength = differenceInDays(periodHistory[i].startDate, periodHistory[i - 1].startDate)
      cycleLengths.push(cycleLength)
    }

    // Calculate period lengths
    const periodLengths = periodHistory.map(log => 
      differenceInDays(log.endDate, log.startDate) + 1
    )

    // Weighted average (recent cycles weighted more heavily)
    const calculateWeightedAverage = (values: number[]): number => {
      const recentValues = values.slice(-6)
      let weightedSum = 0
      let totalWeight = 0

      recentValues.forEach((value, index) => {
        const weight = index + 1
        weightedSum += value * weight
        totalWeight += weight
      })

      return weightedSum / totalWeight
    }

    // Calculate standard deviation for variation
    const calculateStandardDeviation = (values: number[]): number => {
      if (values.length < 2) return 2
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2))
      const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length
      return Math.sqrt(variance)
    }

    return {
      averageCycleLength: Math.round(calculateWeightedAverage(cycleLengths)),
      averagePeriodLength: Math.round(calculateWeightedAverage(periodLengths)),
      cycleVariation: Math.round(calculateStandardDeviation(cycleLengths.slice(-6)) * 10) / 10,
      totalCycles: cycleLengths.length,
    }
  }, [periodHistory])

  return {
    periodHistory,
    setPeriodHistory,
    selectedDates,
    setSelectedDates,
    isLogging,
    setIsLogging,
    editMode,
    setEditMode,
    cycleStats,
  }
}