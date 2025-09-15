"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { simulate, type SimulationParams, type SimulationResult } from "@/lib/simulation"

export default function SimulationPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [params, setParams] = useState<SimulationParams>({
    availableTrainsDelta: 0,
    maintenanceDelayDays: 0,
    fitnessRenewalRate: 80,
    newTrainsetCount: 0,
  })

  const [result, setResult] = useState<SimulationResult | null>(null)

  useEffect(() => {
    const loadTrainsets = async () => {
      try {
        setLoading(true)
        const data = await fetchTrainsets()
        setTrainsets(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load trainsets:", err)
        setError("Failed to load trainset data")
      } finally {
        setLoading(false)
      }
    }

    loadTrainsets()
  }, [])

  useEffect(() => {
    if (trainsets.length > 0) {
      const simulationResult = simulate(trainsets, params)
      setResult(simulationResult)
    }
  }, [trainsets, params])

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)

    // Run simulation immediately if trainsets are available
    if (trainsets.length > 0) {
      const simulationResult = simulate(trainsets, newParams)
      setResult(simulationResult)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2 text-balance">Fleet Simulation</h1>
          <p className="text-muted">Model the impact of operational changes on fleet performance</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-border rounded mb-4"></div>
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-border rounded"></div>
                    <div className="h-2 bg-border rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-border rounded mb-6"></div>
              <div className="h-96 bg-border rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2 text-balance">Fleet Simulation</h1>
          <p className="text-muted">Model the impact of operational changes on fleet performance</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Data</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
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
