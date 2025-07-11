"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, Clock } from "lucide-react"
import { format, differenceInDays } from "date-fns"
import type { PeriodLog, CycleStats } from "@/hooks/use-period-data"

interface PeriodStatsProps {
  periodHistory: PeriodLog[]
  cycleStats: CycleStats
  onDeletePeriod: (period: PeriodLog) => void
}

export function PeriodStats({ periodHistory, cycleStats, onDeletePeriod }: PeriodStatsProps) {
  const calculateLastPeriodStats = () => {
    if (periodHistory.length === 0) return null

    const lastPeriod = periodHistory[periodHistory.length - 1]
    const lastPeriodDuration = differenceInDays(lastPeriod.endDate, lastPeriod.startDate) + 1

    return {
      lastPeriodDuration,
      totalPeriods: periodHistory.length,
    }
  }

  const stats = calculateLastPeriodStats()

  return (
    <div className="space-y-6">
      {/* Cycle Statistics */}
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
                  <div className="text-2xl font-bold text-primary">{cycleStats.averagePeriodLength}</div>
                  <div className="text-sm text-muted-foreground">Avg Period Length</div>
                </div>
              </div>

              {cycleStats.totalCycles > 0 && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{cycleStats.averageCycleLength}</div>
                  <div className="text-sm text-muted-foreground">Average Cycle Length (days)</div>
                </div>
              )}

              <Separator />

              <div className="text-center">
                <div className="text-lg font-semibold">
                  {stats.totalPeriods} Period{stats.totalPeriods !== 1 ? "s" : ""} Logged
                </div>
                {cycleStats.totalCycles > 0 && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Cycle variation: ±{cycleStats.cycleVariation} days
                  </div>
                )}
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
                        onClick={() => onDeletePeriod(log)}
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
  )
}