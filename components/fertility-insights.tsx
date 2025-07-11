"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format, isToday, isTomorrow, differenceInDays } from "date-fns"
import { Heart, Calendar, Info, TrendingUp } from "lucide-react"
import { calculateOvulationForDate, getCurrentPhase } from "@/lib/cycle-predictions"
import type { PeriodLog } from "@/lib/cycle-predictions"

interface FertilityInsightsProps {
  periodHistory: PeriodLog[]
}

export function FertilityInsights({ periodHistory }: FertilityInsightsProps) {
  if (periodHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Fertility Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>Log your periods to see fertility insights and ovulation predictions.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const today = new Date()
  const fertilityData = calculateOvulationForDate(today, periodHistory)
  const currentPhase = getCurrentPhase(today, periodHistory)

  if (!fertilityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Fertility Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Unable to calculate fertility data. Please ensure you have logged recent periods.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const formatDateWithContext = (date: Date) => {
    if (isToday(date)) return `Today (${format(date, "MMM d")})`
    if (isTomorrow(date)) return `Tomorrow (${format(date, "MMM d")})`
    return format(date, "MMM d, yyyy")
  }

  const getPhaseDescription = (phase: string) => {
    const descriptions = {
      Menstrual: "Your period is active. The lining of your uterus is shedding.",
      Follicular: "Your body is preparing for ovulation. Estrogen levels are rising.",
      Ovulation: "You are most fertile now. The egg is being released.",
      Luteal: "Post-ovulation phase. Your body is preparing for the next cycle.",
    }
    return descriptions[phase as keyof typeof descriptions] || "Phase information unavailable."
  }

  const getPhaseColor = (phase: string) => {
    const colors = {
      Menstrual: "bg-red-100 text-red-800",
      Follicular: "bg-green-100 text-green-800",
      Ovulation: "bg-purple-100 text-purple-800",
      Luteal: "bg-yellow-100 text-yellow-800",
    }
    return colors[phase as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const daysToOvulation = differenceInDays(fertilityData.ovulationDate, today)
  const isInFertileWindow = fertilityData.fertileWindow.some((date) => isToday(date))

  return (
    <div className="space-y-6">
      {/* Current Phase */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Current Cycle Phase
          </CardTitle>
          <CardDescription>Your body's current reproductive phase</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Badge className={`text-sm px-3 py-1 ${getPhaseColor(currentPhase)}`}>{currentPhase} Phase</Badge>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{fertilityData.confidence}% Confidence</div>
              <Progress value={fertilityData.confidence} className="h-2 w-20" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{getPhaseDescription(currentPhase)}</p>

          {isInFertileWindow && (
            <Alert>
              <Heart className="h-4 w-4" />
              <AlertDescription className="font-medium">
                You are currently in your fertile window! This is your most fertile time.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Ovulation Timing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Ovulation & Fertility
          </CardTitle>
          <CardDescription>Your predicted ovulation and fertile window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-lg font-semibold text-purple-600">
                {formatDateWithContext(fertilityData.ovulationDate)}
              </div>
              <div className="text-sm text-muted-foreground">Predicted Ovulation</div>
              {daysToOvulation > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  In {daysToOvulation} day{daysToOvulation !== 1 ? "s" : ""}
                </div>
              )}
              {daysToOvulation < 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.abs(daysToOvulation)} day{Math.abs(daysToOvulation) !== 1 ? "s" : ""} ago
                </div>
              )}
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-lg font-semibold text-purple-400">{fertilityData.fertileWindow.length} Days</div>
              <div className="text-sm text-muted-foreground">Fertile Window</div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(fertilityData.fertileWindow[0], "MMM d")} -{" "}
                {format(fertilityData.fertileWindow[fertilityData.fertileWindow.length - 1], "MMM d")}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Fertile Window Days:</h4>
            <div className="flex flex-wrap gap-1">
              {fertilityData.fertileWindow.map((date, index) => (
                <Badge
                  key={date.toISOString()}
                  variant={index === 5 ? "default" : "secondary"}
                  className={`${
                    index === 5
                      ? "bg-purple-600 hover:bg-purple-700"
                      : isToday(date)
                        ? "bg-purple-200 text-purple-800 border-2 border-purple-600"
                        : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {format(date, "MMM d")}
                  {index === 5 && " (O)"}
                  {isToday(date) && " (Today)"}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">(O) = Ovulation day • Highlighted = Today</div>
          </div>
        </CardContent>
      </Card>

      {/* Fertility Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fertility Tips
          </CardTitle>
          <CardDescription>Personalized advice based on your current phase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {currentPhase === "Follicular" && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <h5 className="font-medium text-green-800 mb-1">Follicular Phase Tips:</h5>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Your energy levels may be increasing</li>
                  <li>• Good time for planning and new activities</li>
                  <li>• Fertility is building up towards ovulation</li>
                </ul>
              </div>
            )}

            {currentPhase === "Ovulation" && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <h5 className="font-medium text-purple-800 mb-1">Ovulation Phase Tips:</h5>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Peak fertility time - highest chance of conception</li>
                  <li>• You may feel more confident and social</li>
                  <li>• Track cervical mucus changes</li>
                </ul>
              </div>
            )}

            {currentPhase === "Luteal" && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h5 className="font-medium text-yellow-800 mb-1">Luteal Phase Tips:</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Focus on self-care and rest</li>
                  <li>• You may experience PMS symptoms</li>
                  <li>• Good time for reflection and planning</li>
                </ul>
              </div>
            )}

            {currentPhase === "Menstrual" && (
              <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-medium text-red-800 mb-1">Menstrual Phase Tips:</h5>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Rest and take care of yourself</li>
                  <li>• Stay hydrated and eat iron-rich foods</li>
                  <li>• Light exercise may help with cramps</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
