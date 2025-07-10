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

  // Handle date selection
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
            <CardDescription>
              {isLogging
                ? "Select your period dates. Click dates to add/remove them."
                : "View your logged periods and start tracking new ones."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={undefined}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              modifiers={{
                logged: loggedDates,
                selected: selectedDates,
              }}
              modifiersStyles={{
                logged: {
                  backgroundColor: "#fecaca",
                  color: "#dc2626",
                  fontWeight: "bold",
                },
                selected: {
                  backgroundColor: "#dc2626",
                  color: "white",
                  fontWeight: "bold",
                },
              }}
              className="rounded-md border"
            />

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
              </div>
            )}

            <div className="flex gap-2 mt-4">
              {!isLogging ? (
                <>
                  <Button onClick={startNewPeriod} className="flex-1">
                    Start New Period
                  </Button>
                  {periodHistory.length > 0 && (
                    <Button onClick={continueCurrentPeriod} variant="outline" className="flex-1 bg-transparent">
                      Continue Last Period
                    </Button>
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
                        <div>
                          <div className="font-medium">
                            {format(log.startDate, "MMM d")} - {format(log.endDate, "MMM d, yyyy")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {differenceInDays(log.endDate, log.startDate) + 1} days
                          </div>
                        </div>
                        <Badge variant="outline">
                          {log.days.length} day{log.days.length !== 1 ? "s" : ""}
                        </Badge>
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
    </div>
  )
}
