import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CalendarDays, Info, Heart, Baby, ChevronLeft, ChevronRight } from "lucide-react"
import { format, isFuture, startOfDay, isSameDay, addMonths, subMonths } from "date-fns"
import type { PeriodLog, PeriodPredictions } from "@/hooks/use-period-data"

interface PeriodCalendarProps {
  periodHistory: PeriodLog[]
  selectedDates: Date[]
  isLogging: boolean
  editMode: boolean
  predictions: PeriodPredictions
  onDateSelect: (date: Date | undefined) => void
  onStartNewPeriod: () => void
  onContinueCurrentPeriod: () => void
  onToggleEditMode: () => void
  onSavePeriod: () => void
  onCancelLogging: () => void
}

export function PeriodCalendar({
  periodHistory,
  selectedDates,
  isLogging,
  editMode,
  predictions,
  onDateSelect,
  onStartNewPeriod,
  onContinueCurrentPeriod,
  onToggleEditMode,
  onSavePeriod,
  onCancelLogging,
}: PeriodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const nextMonth = addMonths(currentMonth, 1)

  // Get all logged period dates
  const loggedDates = periodHistory.flatMap(log => log.days)

  // Get all future period dates
  const futurePeriodDates = predictions.futurePeriods.flatMap(period => period.days)

  // Date validation - prevent future dates
  const isDateDisabled = (date: Date) => {
    return isFuture(startOfDay(date))
  }

  // Enhanced date selection with unselection capability
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    if (isLogging) {
      // Add to current logging session or remove if already selected
      const isAlreadySelected = selectedDates.some((d) => isSameDay(d, date))
      if (isAlreadySelected) {
        // Unselect the date
        const updatedDates = selectedDates.filter((d) => !isSameDay(d, date))
        // We need to call the parent's setSelectedDates, so we'll pass the filtered array
        // Since we can't directly call setSelectedDates, we'll use a workaround
        onDateSelect(date) // This will toggle the date in the parent component
      } else {
        // Select the date
        onDateSelect(date)
      }
    } else if (editMode) {
      // Delete mode - remove period days
      const isLoggedDate = loggedDates.some((d) => isSameDay(d, date))
      if (isLoggedDate) {
        onDateSelect(date) // This will trigger deletion in parent
      }
    }
  }

  // Get tooltip content for a specific date
  const getTooltipContent = (date: Date) => {
    const tooltips: string[] = []

    // Check if it's a logged period day
    if (loggedDates.some(d => isSameDay(d, date))) {
      tooltips.push("Period Day - Track your flow and symptoms")
    }

    // Check if it's a selected day during logging
    if (selectedDates.some(d => isSameDay(d, date))) {
      tooltips.push("Selected Period Day - Click again to unselect")
    }

    // Check if it's an ovulation day
    if (predictions.ovulationDates.some(d => isSameDay(d, date))) {
      tooltips.push("Ovulation Day - Peak fertility, egg release occurs")
    }

    // Check if it's in fertile window
    if (predictions.fertileWindows.some(d => isSameDay(d, date))) {
      tooltips.push("Fertile Window - High chance of conception")
    }

    // Check if it's a possible period day
    if (predictions.possibleDays.some(d => isSameDay(d, date))) {
      tooltips.push("Possible Period Day (85% confidence) - Likely continuation")
    }

    // Check if it's a predicted period day
    if (predictions.predictedDays.some(d => isSameDay(d, date))) {
      tooltips.push("Predicted Period Day (75% confidence) - May continue")
    }

    // Check if it's a future period day
    if (futurePeriodDates.some(d => isSameDay(d, date))) {
      tooltips.push("Future Period - Predicted based on your cycle pattern")
    }

    return tooltips.length > 0 ? tooltips.join(" • ") : null
  }

  // Common modifiers for both calendars
  const getModifiers = () => ({
    logged: loggedDates,
    selected: selectedDates,
    today: [new Date()],
    ovulation: predictions.ovulationDates,
    fertile: predictions.fertileWindows,
    futurePeriod: futurePeriodDates,
    possiblePeriod: predictions.possibleDays,
    predictedPeriod: predictions.predictedDays,
  })

  // Common modifier styles for both calendars
  const getModifierStyles = () => ({
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
    today: {
      border: "2px solid #3b82f6",
      borderRadius: "50%",
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
    futurePeriod: {
      backgroundColor: "#f9a8d4",
      color: "#be185d",
      fontWeight: "bold",
      border: "1px solid #ec4899",
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
  })

  // Custom day component with tooltip
  const DayWithTooltip = ({ date, displayMonth }: { date: Date; displayMonth: Date }) => {
    const tooltipContent = getTooltipContent(date)
    const dayNumber = date.getDate()

    if (!tooltipContent) {
      return <span>{dayNumber}</span>
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{dayNumber}</span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Period Calendar
          </CardTitle>
          <CardDescription>
            {isLogging
              ? "Select your period dates. Click dates to add/remove them."
              : editMode
                ? "Edit mode: Click on period dates to delete them."
                : "View your logged periods and start tracking new ones."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")} - {format(nextMonth, "MMMM yyyy")}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="flex items-center gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dual Calendar Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            {/* Current Month */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">{format(currentMonth, "MMMM yyyy")}</h3>
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                modifiers={getModifiers()}
                modifiersStyles={getModifierStyles()}
                className="rounded-md border"
                month={currentMonth}
                components={{
                  Day: ({ date, displayMonth }) => <DayWithTooltip date={date} displayMonth={displayMonth} />
                }}
              />
            </div>

            {/* Next Month */}
            <div>
              <h3 className="text-sm font-medium mb-2 text-center">{format(nextMonth, "MMMM yyyy")}</h3>
              <Calendar
                mode="single"
                selected={undefined}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                modifiers={getModifiers()}
                modifiersStyles={getModifierStyles()}
                className="rounded-md border"
                month={nextMonth}
                components={{
                  Day: ({ date, displayMonth }) => <DayWithTooltip date={date} displayMonth={displayMonth} />
                }}
              />
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="mb-4 p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-3">Calendar Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${editMode ? "bg-red-300 border-2 border-red-600" : "bg-red-600"}`}></div>
                <span>Logged Period Days {editMode && "(Click to delete)"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 border-2 border-orange-700 rounded"></div>
                <span>Possible Period (85%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-300 border-2 border-dashed border-pink-500 rounded"></div>
                <span>Predicted Period (75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-300 border border-pink-500 rounded"></div>
                <span>Future Periods</span>
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
                <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>
                <span>Today</span>
              </div>
            </div>
          </div>

          {/* Period Tips */}
          <div className="mb-4 space-y-3">
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription>
                <strong>Period Tips:</strong> Track consistently for better predictions. Normal periods last 3-7 days. 
                Heavy flow is common on days 1-3, then gradually decreases. Hover over calendar days for detailed info.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Baby className="h-4 w-4" />
              <AlertDescription>
                <strong>Fertility Tips:</strong> You're most fertile 5 days before ovulation through 1 day after. 
                Ovulation typically occurs 14 days before your next period starts. Track cervical mucus changes for additional insights.
              </AlertDescription>
            </Alert>
          </div>

          {/* Selected Dates Display */}
          {selectedDates.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
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
              {isLogging && selectedDates.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    {selectedDates.length} day{selectedDates.length !== 1 ? "s" : ""} logged.
                    {predictions.possibleDays.length > 0 && ` ${predictions.possibleDays.length} more likely.`}
                    {predictions.predictedDays.length > 0 && ` ${predictions.predictedDays.length} possible.`}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Prediction Info */}
          {(predictions.possibleDays.length > 0 || predictions.predictedDays.length > 0) && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Current Period Predictions</span>
              </div>
              <div className="text-sm text-blue-700">
                {predictions.possibleDays.length > 0 && (
                  <p>• {predictions.possibleDays.length} possible day(s) remaining (85% confidence)</p>
                )}
                {predictions.predictedDays.length > 0 && (
                  <p>• {predictions.predictedDays.length} predicted day(s) remaining (75% confidence)</p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {!isLogging ? (
              <>
                <Button onClick={onStartNewPeriod} className="flex-1" disabled={editMode}>
                  Start New Period
                </Button>
                {periodHistory.length > 0 && (
                  <>
                    <Button
                      onClick={onContinueCurrentPeriod}
                      variant="outline"
                      className="flex-1 bg-transparent"
                      disabled={editMode}
                    >
                      Continue Last Period
                    </Button>
                    <Button
                      onClick={onToggleEditMode}
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
                  onClick={onSavePeriod}
                  disabled={selectedDates.length === 0 || selectedDates.length > 10}
                  className="flex-1"
                >
                  Save Period
                </Button>
                <Button onClick={onCancelLogging} variant="outline" className="flex-1 bg-transparent">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}