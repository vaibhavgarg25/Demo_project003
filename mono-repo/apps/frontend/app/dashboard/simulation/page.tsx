"use client"

import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { TRAINSETS } from "@/lib/mock-data"
import { simulate, type SimulationParams, type SimulationResult } from "@/lib/simulation"

export default function SimulationPage() {
  const [params, setParams] = useState<SimulationParams>({
    availableTrainsDelta: 0,
    maintenanceDelayDays: 0,
    fitnessRenewalRate: 80,
    newTrainsetCount: 0,
  })

  const [result, setResult] = useState<SimulationResult | null>(null)

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)

    // Run simulation immediately
    const simulationResult = simulate(TRAINSETS, newParams)
    setResult(simulationResult)
  }

  // Run initial simulation
  if (!result) {
    const initialResult = simulate(TRAINSETS, params)
    setResult(initialResult)
  }

  const chartData = result
    ? [
        {
          metric: "Fleet Availability",
          before: result.before.fleetAvailability,
          after: result.after.fleetAvailability,
          unit: "%",
        },
        {
          metric: "On-Time Performance",
          before: result.before.onTimePerformance,
          after: result.after.onTimePerformance,
          unit: "%",
        },
        {
          metric: "Maintenance Backlog",
          before: result.before.maintenanceBacklog,
          after: result.after.maintenanceBacklog,
          unit: " jobs",
        },
        {
          metric: "Average Mileage",
          before: Math.round(result.before.averageMileage / 1000),
          after: Math.round(result.after.averageMileage / 1000),
          unit: "k km",
        },
      ]
    : []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2 text-balance">Fleet Simulation</h1>
        <p className="text-muted">Model the impact of operational changes on fleet performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Parameter Controls */}
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Simulation Parameters</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Available Trains Change: {params.availableTrainsDelta > 0 ? "+" : ""}
                  {params.availableTrainsDelta}
                </label>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="1"
                  value={params.availableTrainsDelta}
                  onChange={(e) => handleParamChange("availableTrainsDelta", Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>-5</span>
                  <span>0</span>
                  <span>+5</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Maintenance Delay: {params.maintenanceDelayDays} days
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="1"
                  value={params.maintenanceDelayDays}
                  onChange={(e) => handleParamChange("maintenanceDelayDays", Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0</span>
                  <span>15</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Fitness Renewal Rate: {params.fitnessRenewalRate}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={params.fitnessRenewalRate}
                  onChange={(e) => handleParamChange("fitnessRenewalRate", Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  New Trainsets: {params.newTrainsetCount}
                </label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={params.newTrainsetCount}
                  onChange={(e) => handleParamChange("newTrainsetCount", Number(e.target.value))}
                  className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-muted mt-1">
                  <span>0</span>
                  <span>2</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Summary */}
          {result && (
            <div className="bg-surface border border-border rounded-lg p-6">
              <h3 className="font-semibold text-text mb-4">Impact Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Availability</span>
                  <span
                    className={`text-sm font-medium ${
                      result.impact.availabilityChange > 0
                        ? "text-green-600 dark:text-green-400"
                        : result.impact.availabilityChange < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text"
                    }`}
                  >
                    {result.impact.availabilityChange > 0 ? "+" : ""}
                    {result.impact.availabilityChange}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Performance</span>
                  <span
                    className={`text-sm font-medium ${
                      result.impact.performanceChange > 0
                        ? "text-green-600 dark:text-green-400"
                        : result.impact.performanceChange < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text"
                    }`}
                  >
                    {result.impact.performanceChange > 0 ? "+" : ""}
                    {result.impact.performanceChange}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Backlog</span>
                  <span
                    className={`text-sm font-medium ${
                      result.impact.backlogChange < 0
                        ? "text-green-600 dark:text-green-400"
                        : result.impact.backlogChange > 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-text"
                    }`}
                  >
                    {result.impact.backlogChange > 0 ? "+" : ""}
                    {result.impact.backlogChange} jobs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted">Avg Mileage</span>
                  <span
                    className={`text-sm font-medium ${
                      result.impact.mileageChange < 0
                        ? "text-green-600 dark:text-green-400"
                        : result.impact.mileageChange > 0
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-text"
                    }`}
                  >
                    {result.impact.mileageChange > 0 ? "+" : ""}
                    {Math.round(result.impact.mileageChange / 1000)}k km
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Chart */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text mb-6">Before vs After Comparison</h2>

            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 12, fill: "var(--muted)" }}
                    axisLine={{ stroke: "var(--border)" }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "var(--muted)" }} axisLine={{ stroke: "var(--border)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      color: "var(--text)",
                    }}
                    formatter={(value, name) => [
                      `${value}${chartData.find((d) => d.before === value || d.after === value)?.unit || ""}`,
                      name === "before" ? "Before" : "After",
                    ]}
                  />
                  <Bar dataKey="before" fill="var(--muted)" name="before" />
                  <Bar dataKey="after" fill="var(--text)" name="after" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              {result &&
                chartData.map((item) => (
                  <div key={item.metric} className="text-center">
                    <p className="text-xs text-muted mb-1">{item.metric}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-muted">
                        {item.before}
                        {item.unit}
                      </span>
                      <span className="text-muted">→</span>
                      <span className="text-sm font-medium text-text">
                        {item.after}
                        {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
