"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays } from "lucide-react"
import { format, isFuture, startOfDay, isSameDay } from "date-fns"
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
  const today = startOfDay(new Date())

  // Get all logged period dates
  const loggedDates = periodHistory.flatMap(log => log.days)

  // Get all future period dates
  const futurePeriodDates = predictions.futurePeriods.flatMap(period => period.days)

  // Date validation - prevent future dates
  const isDateDisabled = (date: Date) => {
    return isFuture(startOfDay(date))
  }

  return (
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
        <Calendar
          mode="single"
          selected={undefined}
          onSelect={onDateSelect}
          disabled={isDateDisabled}
          modifiers={{
            logged: loggedDates,
            selected: selectedDates,
            today: [today],
            ovulation: predictions.ovulationDates,
            fertile: predictions.fertileWindows,
            futurePeriod: futurePeriodDates,
            possiblePeriod: predictions.possibleDays,
            predictedPeriod: predictions.predictedDays,
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
          }}
          className="rounded-md border"
        />

        {/* Calendar Legend */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Calendar Legend</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${editMode ? "bg-red-300 border-2 border-red-600" : "bg-red-600"}`}></div>
              <span>🔴 Logged Period Days {editMode && "(Click to delete)"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 border-2 border-orange-700 rounded"></div>
              <span>🟠 Possible Period (85%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-300 border-2 border-dashed border-pink-500 rounded"></div>
              <span>🌸 Predicted Period (75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-pink-300 border border-pink-500 rounded"></div>
              <span>🌸 Future Periods</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded-full"></div>
              <span>🟣 Ovulation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-300 rounded"></div>
              <span>💜 Fertile Window</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded-full"></div>
              <span>🔵 Today</span>
            </div>
          </div>
        </div>

        {/* Selected Dates Display */}
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

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
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
  )
}