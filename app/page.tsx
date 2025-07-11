"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, differenceInDays, isFuture, isSameDay, startOfDay } from "date-fns"
import { CalendarDays, TrendingUp, Clock } from "lucide-react"
import { useCyclePredictions } from "@/lib/cycle-predictions"
import { PredictionsPanel } from "@/components/predictions-panel"

// Add these imports at the top
import { calculateOvulationForDate, getCurrentPhase } from "@/lib/cycle-predictions"
// Add this import at the top with the other imports
import { FertilityInsights } from "@/components/fertility-insights"
// Add this new import
import { periodPredictionEngine } from "@/lib/period-prediction"

interface PeriodLog {
  startDate: Date
  endDate: Date
  days: Date[]
}

export default function MenstrualTracker() {
  const [periodHistory, setPeriodHistory] = useState<PeriodLog[]>([])
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<Date[] | null>(null)
  const [isLogging, setIsLogging] = useState(false)

  // Add this after the existing useState declarations
  const { predictions, insights, isIrregular, error } = useCyclePredictions(periodHistory)

  // Add this new state variable after the existing useState declarations (around line 25):
  const [editMode, setEditMode] = useState(false)

  // Load data from localStorage on component mount
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

  // Get all logged period dates for calendar highlighting
  const getLoggedDates = () => {
    const allDates: Date[] = []
    periodHistory.forEach((log) => {
      allDates.push(...log.days)
    })
    if (currentPeriod) {
      allDates.push(...currentPeriod)
    }
    return allDates
  }

  // Date validation - prevent future dates
  const isDateDisabled = (date: Date) => {
    return isFuture(startOfDay(date))
  }

  // Add this function after the existing helper functions (around line 50)
  const getFertilityDates = () => {
    if (periodHistory.length === 0) return { ovulationDates: [], fertileWindowDates: [], predictedPeriodDates: [] }

    const ovulationDates: Date[] = []
    const fertileWindowDates: Date[] = []
    const predictedPeriodDates: Date[] = []

    // Get current fertility data
    const today = new Date()
    const fertilityData = calculateOvulationForDate(today, periodHistory)

    if (fertilityData) {
      ovulationDates.push(fertilityData.ovulationDate)
      fertileWindowDates.push(...fertilityData.fertileWindow)
    }

    // Add predicted period dates if we have predictions
    if (predictions?.nextPeriod) {
      predictedPeriodDates.push(...predictions.nextPeriod.predictedDays)
    }

    return { ovulationDates, fertileWindowDates, predictedPeriodDates }
  }

  // Add this new function after getFertilityDates
  const getCurrentPeriodPredictions = () => {
    if (!isLogging || selectedDates.length === 0) {
      return { possiblePeriodDays: [], predictedPeriodDays: [] }
    }

    const prediction = periodPredictionEngine.predictRemainingDays(selectedDates)
    return {
      possiblePeriodDays: prediction.possibleDays,
      predictedPeriodDays: prediction.predictedDays,
    }
  }

  // Replace the handleDateSelect function with this enhanced version that supports deletion:
  // Handle date selection and deletion
  const handleDateSelect = (date: Date | undefined) => {
    if (!date || isDateDisabled(date)) return

    if (isLogging) {
      // Add to current logging session
      setSelectedDates((prev) => {
        const exists = prev.some((d) => isSameDay(d, date))
        if (exists) {
          return prev.filter((d) => !isSameDay(d, date))
        } else {
          return [...prev, date].sort((a, b) => a.getTime() - b.getTime())
        }
      })
    } else if (editMode) {
      // Delete mode - remove period days
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
    setCurrentPeriod(null)
  }

  // Continue current period
  const continueCurrentPeriod = () => {
    const lastPeriod = periodHistory[periodHistory.length - 1]
    if (lastPeriod) {
      setCurrentPeriod([...lastPeriod.days])
      setSelectedDates([])
      setIsLogging(true)
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

    if (currentPeriod) {
      // Update existing period
      const updatedDays = [...currentPeriod, ...selectedDates]
        .filter((date, index, arr) => arr.findIndex((d) => isSameDay(d, date)) === index)
        .sort((a, b) => a.getTime() - b.getTime())

      const updatedLog: PeriodLog = {
        startDate: updatedDays[0],
        endDate: updatedDays[updatedDays.length - 1],
        days: updatedDays,
      }

      setPeriodHistory((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = updatedLog
        return updated
      })
    } else {
      // Add new period
      setPeriodHistory((prev) => [...prev, newLog])
    }

    // Reset state
    setSelectedDates([])
    setCurrentPeriod(null)
    setIsLogging(false)
  }

  // Cancel logging
  const cancelLogging = () => {
    setSelectedDates([])
    setCurrentPeriod(null)
    setIsLogging(false)
  }

  // Add these new functions after the cancelLogging function:
  // Delete a specific period day
  const deletePeriodDay = (dateToDelete: Date) => {
    setPeriodHistory((prev) => {
      return prev
        .map((log) => {
          // Check if this date belongs to this period
          const hasDate = log.days.some((d) => isSameDay(d, dateToDelete))

          if (hasDate) {
            const updatedDays = log.days.filter((d) => !isSameDay(d, dateToDelete))

            // If no days left, we'll filter out this entire period later
            if (updatedDays.length === 0) {
              return null
            }

            // Update start and end dates
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
        .filter(Boolean) as PeriodLog[] // Remove null entries (empty periods)
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

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode)
    // Exit logging mode if entering edit mode
    if (!editMode && isLogging) {
      cancelLogging()
    }
  }

  // Calculate statistics
  const calculateStats = () => {
    if (periodHistory.length === 0) return null

    const lastPeriod = periodHistory[periodHistory.length - 1]
    const lastPeriodDuration = differenceInDays(lastPeriod.endDate, lastPeriod.startDate) + 1

    // Calculate average period length
    const totalDays = periodHistory.reduce((sum, log) => {
      return sum + (differenceInDays(log.endDate, log.startDate) + 1)
    }, 0)
    const avgPeriodLength = Math.round(totalDays / periodHistory.length)

    // Calculate average cycle length (if we have multiple periods)
    let avgCycleLength = null
    if (periodHistory.length > 1) {
      const cycleLengths = []
      for (let i = 1; i < periodHistory.length; i++) {
        const cycleLength = differenceInDays(periodHistory[i].startDate, periodHistory[i - 1].startDate)
        cycleLengths.push(cycleLength)
      }
      avgCycleLength = Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length)
    }

    return {
      lastPeriodDuration,
      avgPeriodLength,
      avgCycleLength,
      totalPeriods: periodHistory.length,
    }
  }

  const stats = calculateStats()
  const loggedDates = getLoggedDates()

  // Update the Calendar component section (around line 180) to include the new modifiers
  const { ovulationDates, fertileWindowDates, predictedPeriodDates } = getFertilityDates()
  const { possiblePeriodDays, predictedPeriodDays } = getCurrentPeriodPredictions()
  const currentPhase = getCurrentPhase(new Date(), periodHistory)

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Menstrual Tracker</h1>
        <p className="text-muted-foreground">Track your period and monitor your cycle</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Calendar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Period Calendar
            </CardTitle>
            {/* Update the CardDescription to include edit mode information: */}
            <CardDescription>
              {isLogging
                ? "Select your period dates. Click dates to add/remove them."
                : editMode
                  ? "Edit mode: Click on period dates to delete them."
                  : "View your logged periods and start tracking new ones."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Replace the existing Calendar component with this updated version */}
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              modifiers={{
                logged: loggedDates,
                selected: selectedDates,
                ovulation: ovulationDates,
                fertile: fertileWindowDates,
                predicted: predictedPeriodDates,
                possiblePeriod: possiblePeriodDays,
                predictedPeriod: predictedPeriodDays,
              }}
              modifiersStyles={{
                logged: {
                  backgroundColor: editMode ? "#fca5a5" : "#dc2626",
                  color: editMode ? "#7f1d1d" : "white",
                  fontWeight: "bold",
                  cursor: editMode ? "pointer" : "default",
                  border: editMode ? "2px solid #dc2626" : "none",
                },
                selected: {
                  backgroundColor: "#991b1b",
                  color: "white",
                  fontWeight: "bold",
                  border: "2px solid #7f1d1d",
                },
                ovulation: {
                  backgroundColor: "#7c3aed",
                  color: "white",
                  fontWeight: "bold",
                  borderRadius: "50%",
                },
                fertile: {
                  backgroundColor: "#c4b5fd",
                  color: "#5b21b6",
                  fontWeight: "bold",
                },
                predicted: {
                  backgroundColor: "#fbbf24",
                  color: "#92400e",
                  fontWeight: "bold",
                  border: "2px dashed #d97706",
                },
                possiblePeriod: {
                  backgroundColor: "#fb923c",
                  color: "white",
                  fontWeight: "bold",
                  border: "2px solid #ea580c",
                },
                predictedPeriod: {
                  backgroundColor: "#f9a8d4",
                  color: "#be185d",
                  fontWeight: "bold",
                  border: "2px dashed #ec4899",
                },
              }}
              className="rounded-md border"
            />

            {/* Add the calendar legend right after the Calendar component */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-3">Calendar Legend</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {/* Update the calendar legend to show edit mode: */}
                  <div
                    className={`w-4 h-4 rounded ${editMode ? "bg-red-300 border-2 border-red-600" : "bg-red-600"}`}
                  ></div>
                  <span>Period Days {editMode && "(Click to delete)"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
                  <span>Ovulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-300 rounded"></div>
                  <span>Fertile Window</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 border-2 border-dashed border-orange-600 rounded"></div>
                  <span>Predicted Period</span>
                </div>
                {/* Add new legend items for current period predictions */}
                {(possiblePeriodDays.length > 0 || predictedPeriodDays.length > 0) && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-500 border-2 border-orange-700 rounded"></div>
                      <span>Possible Period (85%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-pink-300 border-2 border-dashed border-pink-500 rounded"></div>
                      <span>Predicted Period (75%)</span>
                    </div>
                  </>
                )}
              </div>
              {periodHistory.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Current Phase:</span>
                    <Badge variant="outline" className="font-medium">
                      {currentPhase}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {selectedDates.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Selected dates:</p>
                <div className="flex flex-wrap gap-1">
                  {selectedDates.map((date) => (
                    <Badge key={date.toISOString()} variant="secondary">
                      {format(date, "MMM d")}
                    </Badge>
                  ))}
                </div>
                {selectedDates.length > 10 && (
                  <p className="text-sm text-destructive mt-2">Warning: Period cannot exceed 10 days</p>
                )}
                {/* Add period prediction summary */}
                {isLogging && selectedDates.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-muted-foreground">
                      {periodPredictionEngine.getPredictionSummary(selectedDates)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Update the button section to include edit mode toggle: */}
            <div className="flex gap-2 mt-4">
              {!isLogging ? (
                <>
                  <Button onClick={startNewPeriod} className="flex-1" disabled={editMode}>
                    Start New Period
                  </Button>
                  {periodHistory.length > 0 && (
                    <>
                      <Button
                        onClick={continueCurrentPeriod}
                        variant="outline"
                        className="flex-1 bg-transparent"
                        disabled={editMode}
                      >
                        Continue Last Period
                      </Button>
                      <Button
                        onClick={toggleEditMode}
                        variant={editMode ? "destructive" : "outline"}
                        className="flex-1 bg-transparent"
                      >
                        {editMode ? "Exit Edit" : "Edit Periods"}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <>
                  <Button
                    onClick={savePeriod}
                    disabled={selectedDates.length === 0 || selectedDates.length > 10}
                    className="flex-1"
                  >
                    Save Period
                  </Button>
                  <Button onClick={cancelLogging} variant="outline" className="flex-1 bg-transparent">
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Cycle Statistics
              </CardTitle>
              <CardDescription>Your period and cycle insights</CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.lastPeriodDuration}</div>
                      <div className="text-sm text-muted-foreground">Last Period (days)</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.avgPeriodLength}</div>
                      <div className="text-sm text-muted-foreground">Avg Period Length</div>
                    </div>
                  </div>

                  {stats.avgCycleLength && (
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.avgCycleLength}</div>
                      <div className="text-sm text-muted-foreground">Average Cycle Length (days)</div>
                    </div>
                  )}

                  <Separator />

                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {stats.totalPeriods} Period{stats.totalPeriods !== 1 ? "s" : ""} Logged
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Start logging your periods to see statistics</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Periods */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Periods</CardTitle>
              <CardDescription>Your last few logged periods</CardDescription>
            </CardHeader>
            <CardContent>
              {periodHistory.length > 0 ? (
                <div className="space-y-3">
                  {periodHistory
                    .slice(-5)
                    .reverse()
                    .map((log, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">
                            {format(log.startDate, "MMM d")} - {format(log.endDate, "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {differenceInDays(log.endDate, log.startDate) + 1} days
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {log.days.length} day{log.days.length !== 1 ? "s" : ""}
                          </Badge>
                          <Button
                            onClick={() => deletePeriod(log)}
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-8 w-8"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No periods logged yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Predictions Section */}
      {periodHistory.length > 0 && (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">AI-Powered Predictions</h2>
            <p className="text-muted-foreground">Smart forecasting based on your cycle patterns and history</p>
          </div>
          <PredictionsPanel predictions={predictions} insights={insights} isIrregular={isIrregular} error={error} />
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
