"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Play, RotateCcw, Save } from "lucide-react"
import { fetchTrainsets, type Trainset } from "@/lib/mock-data"
import { generatePlan, savePlannerRun, type PlannerResult } from "@/lib/planner"

const plannerSchema = z.object({
  maxTrains: z.number().min(1).max(20),
  requireCleaningSlots: z.boolean(),
  excludeStatuses: z.array(z.string()),
  prioritizeHighMileage: z.boolean(),
  minFitnessDays: z.number().min(0).max(365),
})

type PlannerFormData = z.infer<typeof plannerSchema>

const statusOptions = [
  { value: "Active", label: "Active" },
  { value: "Standby", label: "Standby" },
  { value: "Maintenance", label: "Maintenance" },
  { value: "OutOfService", label: "Out of Service" },
]

export default function PlannerPage() {
  const [trainsets, setTrainsets] = useState<Trainset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<PlannerResult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    const loadTrainsets = async () => {
      try {
        setLoading(true)
        const data = await fetchTrainsets()
        if (!isMounted.current) return
        setTrainsets(data)
        setError(null)
      } catch (err) {
        console.error("Failed to load trainsets:", err)
        if (!isMounted.current) return
        setError("Failed to load trainset data")
      } finally {
        if (!isMounted.current) return
        setLoading(false)
      }
    }

    loadTrainsets()

    return () => {
      isMounted.current = false
    }
  }, [])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PlannerFormData>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      maxTrains: 8,
      requireCleaningSlots: true,
      excludeStatuses: ["OutOfService"],
      prioritizeHighMileage: false,
      minFitnessDays: 7,
    },
  })

  const watchedValues = watch()

  const onSubmit = useCallback(
    async (data: PlannerFormData) => {
      if (trainsets.length === 0) return

      setIsGenerating(true)

      // keep the UX snappy but realistic — don't change backend or endpoint flows
      await new Promise((resolve) => setTimeout(resolve, 600))

      try {
        const planResults = generatePlan(trainsets, data)
        if (!isMounted.current) return
        setResults(planResults)
      } catch (err) {
        console.error("Planner generation failed", err)
        if (!isMounted.current) return
        setError("Failed to generate plan — please try different parameters")
      } finally {
        if (!isMounted.current) return
        setIsGenerating(false)
      }
    },
    [trainsets]
  )

  const handleSave = useCallback(() => {
    if (results.length === 0) return
    // make save idempotent & explicit
    const confirmed = window.confirm("Save this plan to history?")
    if (!confirmed) return
    try {
      savePlannerRun(watchedValues, results)
      // user-visible success feedback without changing backend API
      window.alert("Plan saved to history!")
    } catch (err) {
      console.error("Save failed", err)
      window.alert("Failed to save plan. Check console for details.")
    }
  }, [results, watchedValues])

  const handleReset = useCallback(() => {
    reset()
    setResults([])
    setError(null)
  }, [reset])

  // memoized derived values for cheaper re-renders
  const selectedResults = useMemo(() => results.filter((r) => r.selected), [results])

  const averageScore = useMemo(() => {
    if (selectedResults.length === 0) return 0
    return Math.round(selectedResults.reduce((sum, r) => sum + r.score, 0) / selectedResults.length)
  }, [selectedResults])

  const averageConfidence = useMemo(() => {
    if (selectedResults.length === 0) return 0
    return Math.round(
      selectedResults.reduce((sum, r) => sum + r.confidence, 0) / selectedResults.length
    )
  }, [selectedResults])

  // small accessibility + UX improvements in the render below — skeletons, aria labels, min/max on inputs

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-text mb-2">Fleet Allocation Planner</h1>
          <p className="text-muted">Generate optimal trainset allocations based on your operational requirements</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-lg p-6 animate-pulse" aria-hidden>
              <div className="h-6 bg-border rounded mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 bg-border rounded"></div>
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-lg p-12 animate-pulse" aria-hidden>
              <div className="h-8 bg-border rounded"></div>
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
          <h1 className="text-2xl font-bold text-text mb-2">Fleet Allocation Planner</h1>
          <p className="text-muted">Generate optimal trainset allocations based on your operational requirements</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => handleReset()}
              className="px-4 py-2 border border-border rounded-md text-text hover:bg-bg-hover transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2">Fleet Allocation Planner</h1>
        <p className="text-muted">Generate optimal trainset allocations based on your operational requirements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Planning Form */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold text-text mb-4">Planning Parameters</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-labelledby="planner-form">
              <div>
                <label htmlFor="maxTrains" className="block text-sm font-medium text-text mb-1">
                  Maximum Trainsets
                </label>
                <input
                  id="maxTrains"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  step={1}
                  {...register("maxTrains", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
                  aria-invalid={!!errors.maxTrains}
                />
                {errors.maxTrains && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.maxTrains.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="minFitnessDays" className="block text-sm font-medium text-text mb-1">
                  Minimum Fitness Days
                </label>
                <input
                  id="minFitnessDays"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={365}
                  step={1}
                  {...register("minFitnessDays", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-text focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
                  aria-invalid={!!errors.minFitnessDays}
                />
                {errors.minFitnessDays && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.minFitnessDays.message}</p>
                )}
              </div>

              <fieldset className="space-y-2" aria-label="toggles">
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("requireCleaningSlots")} className="rounded border-border" />
                  <span className="text-sm text-text">Require cleaning slots</span>
                </label>

                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register("prioritizeHighMileage")} className="rounded border-border" />
                  <span className="text-sm text-text">Prioritize high mileage</span>
                </label>
              </fieldset>

              <div>
                <label className="block text-sm font-medium text-text mb-2">Exclude Status</label>
                <div className="space-y-1">
                  {statusOptions.map((option) => (
                    <label key={option.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={option.value}
                        {...register("excludeStatuses")}
                        className="rounded border-border"
                        aria-checked={String(watchedValues.excludeStatuses || []).includes(option.value)}
                      />
                      <span className="text-sm text-text">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isGenerating || trainsets.length === 0}
                  // hard-coded neutral colors so button is visible in both light/dark themes
                  style={{
                    backgroundColor: isGenerating || trainsets.length === 0 ? "#94a3b8" : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.375rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                  }}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Generate Plan
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  title="Reset form"
                  className="px-4 py-2 border border-border rounded-md text-text hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </form>

            <p className="text-xs text-muted mt-3">Tip: exclude statuses to quickly remove unavailable trainsets from consideration.</p>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {results.length > 0 ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-surface border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text">Plan Summary</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSave}
                      disabled={results.length === 0}
                      className="flex items-center gap-2 px-3 py-1 text-sm border border-border rounded-md text-text hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2 disabled:opacity-40"
                    >
                      <Save className="w-4 h-4" />
                      Save Plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text">{selectedResults.length}</p>
                    <p className="text-sm text-muted">Selected Trainsets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text">{averageScore}</p>
                    <p className="text-sm text-muted">Average Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-text">{averageConfidence}%</p>
                    <p className="text-sm text-muted">Confidence</p>
                  </div>
                </div>
              </div>

              {/* Selected Trainsets */}
              <div className="bg-surface border border-border rounded-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-text">Selected Trainsets</h3>
                </div>
                <div className="divide-y divide-border">
                  {selectedResults.map((result) => (
                    <div key={result.trainset.id} className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-text">{result.trainset.id}</h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                            {result.trainset.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted mt-1">{result.reason}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                          <span>Mileage: {result.trainset.mileage.toLocaleString()}</span>
                          <span>Position: {result.trainset.stabling_position}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-lg font-bold text-text">{result.score}</p>
                            <p className="text-xs text-muted">Score</p>
                          </div>
                          <div className="relative w-12 h-12">
                            {/* Minimal KPI ring — relies on existing global CSS for .kpi-ring. Keeps markup identical so styling remains compatible with your global CSS. */}
                            <div
                              className="kpi-ring w-12 h-12"
                              style={{ "--progress": result.confidence } as React.CSSProperties}
                            >
                              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-text">
                                {Math.round(result.confidence)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* All Results */}
              {results.length > selectedResults.length && (
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-text">All Evaluated Trainsets</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    <div className="divide-y divide-border">
                      {results.map((result) => (
                        <div
                          key={result.trainset.id}
                          className={`p-4 flex items-center justify-between ${
                            result.selected ? "bg-green-50 dark:bg-green-900/10" : ""
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium text-text">{result.trainset.id}</h4>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  result.trainset.status === "Active"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : result.trainset.status === "Standby"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : result.trainset.status === "Maintenance"
                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {result.trainset.status}
                              </span>
                              {result.selected && (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted mt-1">{result.reason}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-text">{result.score}</p>
                            <p className="text-xs text-muted">{result.confidence}% confidence</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-bg-hover rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-muted" />
              </div>
              <h3 className="text-lg font-medium text-text mb-2">Ready to Generate Plan</h3>
              <p className="text-muted">Configure your parameters and click Generate Plan to see optimal trainset allocations</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
