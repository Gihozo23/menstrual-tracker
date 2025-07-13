"use client"

import { isSameDay, format } from "date-fns"
import { usePeriodData } from "@/hooks/use-period-data"
import { usePeriodPredictions } from "@/hooks/use-period-predictions"
import { PeriodCalendar } from "@/components/period-calendar"
import { PeriodStats } from "@/components/period-stats"
import { PredictionsPanel } from "@/components/predictions-panel"
import { FertilityInsights } from "@/components/fertility-insights"
import { useCyclePredictions } from "@/lib/cycle-predictions"
import type { PeriodLog } from "@/hooks/use-period-data"

export default function MenstrualTracker() {
  const {
    periodHistory,
    setPeriodHistory,
    selectedDates,
    setSelectedDates,
    isLogging,
    setIsLogging,
    editMode,
    setEditMode,
    cycleStats,
  } = usePeriodData()

  const predictions = usePeriodPredictions(periodHistory, selectedDates, isLogging, cycleStats)
  const { predictions: aiPredictions, insights, isIrregular, error } = useCyclePredictions(periodHistory)

  // Handle date selection and deletion
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (isLogging) {
      // Add to current logging session or remove if already selected
      setSelectedDates((prev) => {
        const exists = prev.some((d) => isSameDay(d, date))
        if (exists) {
          // Remove the date (unselect)
          return prev.filter((d) => !isSameDay(d, date))
        } else {
          // Add the date (select)
          return [...prev, date].sort((a, b) => a.getTime() - b.getTime())
        }
      })
    } else if (editMode) {
      // Delete mode - remove period days
      const loggedDates = periodHistory.flatMap(log => log.days)
      const isLoggedDate = loggedDates.some((d) => isSameDay(d, date))
      if (isLoggedDate) {
        deletePeriodDay(date)
      }
    }
  }

  // Start new period logging
  const startNewPeriod = () => {
    setIsLogging(true)
    setSelectedDates([])
  }

  // Continue current period
  const continueCurrentPeriod = () => {
    const lastPeriod = periodHistory[periodHistory.length - 1]
    if (lastPeriod) {
      setSelectedDates([...lastPeriod.days])
      setIsLogging(true)
    }
  }

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode)
    if (!editMode && isLogging) {
      cancelLogging()
    }
  }

  // Save period log
  const savePeriod = () => {
    if (selectedDates.length === 0) return

    // Validate max 10 days
    if (selectedDates.length > 10) {
      alert("Period cannot exceed 10 days. Please adjust your selection.")
      return
    }

    const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
    const newLog: PeriodLog = {
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      days: sortedDates,
    }

    // Check if we're updating an existing period
    const existingPeriodIndex = periodHistory.findIndex(log => 
      log.days.some(day => selectedDates.some(selected => isSameDay(day, selected)))
    )

    if (existingPeriodIndex !== -1) {
      // Update existing period
      const updatedHistory = [...periodHistory]
      updatedHistory[existingPeriodIndex] = newLog
      setPeriodHistory(updatedHistory)
    } else {
      // Add new period
      setPeriodHistory(prev => [...prev, newLog])
    }

    // Reset state
    setSelectedDates([])
    setIsLogging(false)
  }

  // Cancel logging
  const cancelLogging = () => {
    setSelectedDates([])
    setIsLogging(false)
  }

  // Delete a specific period day
  const deletePeriodDay = (dateToDelete: Date) => {
    setPeriodHistory((prev) => {
      return prev
        .map((log) => {
          const hasDate = log.days.some((d) => isSameDay(d, dateToDelete))

          if (hasDate) {
            const updatedDays = log.days.filter((d) => !isSameDay(d, dateToDelete))

            if (updatedDays.length === 0) {
              return null
            }

            const sortedDays = updatedDays.sort((a, b) => a.getTime() - b.getTime())
            return {
              ...log,
              days: sortedDays,
              startDate: sortedDays[0],
              endDate: sortedDays[sortedDays.length - 1],
            }
          }

          return log
        })
        .filter(Boolean) as PeriodLog[]
    })
  }

  // Delete an entire period
  const deletePeriod = (periodToDelete: PeriodLog) => {
    if (
      confirm(
        `Are you sure you want to delete the period from ${format(periodToDelete.startDate, "MMM d")} to ${format(periodToDelete.endDate, "MMM d, yyyy")}?`,
      )
    ) {
      setPeriodHistory((prev) => prev.filter((log) => log.startDate.getTime() !== periodToDelete.startDate.getTime()))
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Menstrual Tracker</h1>
        <p className="text-muted-foreground">Track your period and monitor your cycle</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Section */}
        <PeriodCalendar
          periodHistory={periodHistory}
          selectedDates={selectedDates}
          isLogging={isLogging}
          editMode={editMode}
          predictions={predictions}
          onDateSelect={handleDateSelect}
          onStartNewPeriod={startNewPeriod}
          onContinueCurrentPeriod={continueCurrentPeriod}
          onToggleEditMode={toggleEditMode}
          onSavePeriod={savePeriod}
          onCancelLogging={cancelLogging}
        />

        {/* Statistics Section */}
        <PeriodStats
          periodHistory={periodHistory}
          cycleStats={cycleStats}
          onDeletePeriod={deletePeriod}
        />
      </div>

      {/* AI Predictions Section */}
      {periodHistory.length > 0 && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">AI-Powered Predictions</h2>
            <p className="text-muted-foreground">Smart forecasting based on your cycle patterns and history</p>
          </div>
          <PredictionsPanel predictions={aiPredictions} insights={insights} isIrregular={isIrregular} error={error} />
        </div>
      )}

      {/* Fertility Insights Section */}
      {periodHistory.length > 0 && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Fertility & Ovulation Tracking</h2>
            <p className="text-muted-foreground">Track your fertile window and understand your cycle phases</p>
          </div>
          <FertilityInsights periodHistory={periodHistory} />
        </div>
      )}
    </div>
  )
}