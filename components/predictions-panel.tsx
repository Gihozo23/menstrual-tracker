"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { format, isToday, isTomorrow } from "date-fns"
import { Brain, Calendar, Heart, TrendingUp, AlertTriangle, Info } from "lucide-react"
import type { PredictionData } from "@/lib/cycle-predictions"

interface PredictionsPanelProps {
  predictions: PredictionData | null
  insights: string[]
  isIrregular: boolean
  error: string | null
}

export function PredictionsPanel({ predictions, insights, isIrregular, error }: PredictionsPanelProps) {
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!predictions) return null

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return "High"
    if (confidence >= 60) return "Medium"
    return "Low"
  }

  const formatDateWithContext = (date: Date) => {
    if (isToday(date)) return `Today (${format(date, "MMM d")})`
    if (isTomorrow(date)) return `Tomorrow (${format(date, "MMM d")})`
    return format(date, "MMM d, yyyy")
  }

  return (
    <div className="space-y-6">
      {/* Irregular Cycle Warning */}
      {isIrregular && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Your cycles appear to be irregular. Predictions may be less accurate. Consider consulting a healthcare
            provider.
          </AlertDescription>
        </Alert>
      )}

      {/* Next Period Prediction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Period Prediction
          </CardTitle>
          <CardDescription>Based on your cycle history and patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{formatDateWithContext(predictions.nextPeriod.startDate)}</div>
              <div className="text-sm text-muted-foreground">Expected start date</div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${getConfidenceColor(predictions.nextPeriod.confidence)}`}>
                {predictions.nextPeriod.confidence}%
              </div>
              <div className="text-sm text-muted-foreground">
                {getConfidenceLabel(predictions.nextPeriod.confidence)} confidence
              </div>
            </div>
          </div>

          <Progress value={predictions.nextPeriod.confidence} className="h-2" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium text-muted-foreground">Predicted Days</div>
              <div>{predictions.nextPeriod.predictedDays.length} days</div>
            </div>
            <div>
              <div className="font-medium text-muted-foreground">Possible Range</div>
              <div>{predictions.nextPeriod.possibleDays.length} days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ovulation & Fertility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Fertility Window
          </CardTitle>
          <CardDescription>Ovulation and fertile days prediction</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">{formatDateWithContext(predictions.ovulation.date)}</div>
              <div className="text-sm text-muted-foreground">Predicted ovulation</div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-semibold ${getConfidenceColor(predictions.ovulation.confidence)}`}>
                {predictions.ovulation.confidence}%
              </div>
              <div className="text-sm text-muted-foreground">
                {getConfidenceLabel(predictions.ovulation.confidence)} confidence
              </div>
            </div>
          </div>

          <Progress value={predictions.ovulation.confidence} className="h-2" />

          <div>
            <div className="font-medium text-muted-foreground mb-2">Fertile Window</div>
            <div className="flex flex-wrap gap-1">
              {predictions.ovulation.fertileWindow.map((date, index) => (
                <Badge
                  key={date.toISOString()}
                  variant={index === 5 ? "default" : "secondary"}
                  className={index === 5 ? "bg-pink-500 hover:bg-pink-600" : ""}
                >
                  {format(date, "MMM d")}
                  {index === 5 && " (O)"}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">(O) = Ovulation day</div>
          </div>
        </CardContent>
      </Card>

      {/* Cycle Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cycle Analysis
          </CardTitle>
          <CardDescription>Your personal cycle patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{predictions.analysis.averageCycleLength}</div>
              <div className="text-sm text-muted-foreground">Avg Cycle Length</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{predictions.analysis.averagePeriodLength}</div>
              <div className="text-sm text-muted-foreground">Avg Period Length</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Regularity Score</span>
              <span className={`text-sm font-semibold ${getConfidenceColor(predictions.analysis.regularityScore)}`}>
                {predictions.analysis.regularityScore}%
              </span>
            </div>
            <Progress value={predictions.analysis.regularityScore} className="h-2" />
          </div>

          <Separator />

          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Cycles Analyzed:</span>
              <span className="font-medium">{predictions.analysis.totalCycles}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cycle Variation:</span>
              <span className="font-medium">±{predictions.analysis.cycleVariation} days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Future Cycles Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Future Cycles</CardTitle>
          <CardDescription>Next 6 months prediction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictions.futureCycles.slice(0, 3).map((cycle) => (
              <div key={cycle.cycleNumber} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                <div>
                  <div className="font-medium">
                    {format(cycle.startDate, "MMM d")} - {format(cycle.endDate, "MMM d, yyyy")}
                  </div>
                  <div className="text-sm text-muted-foreground">Cycle {cycle.cycleNumber}</div>
                </div>
                <Badge variant="outline" className={getConfidenceColor(cycle.confidence)}>
                  {cycle.confidence}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cycle Insights</CardTitle>
            <CardDescription>Personalized observations about your cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
