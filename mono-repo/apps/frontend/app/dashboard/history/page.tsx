"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Calendar, Users, TrendingUp, Eye, Trash2 } from "lucide-react"
import { getPlannerHistory, type PlannerRun } from "@/lib/planner"

export default function HistoryPage() {
  const [history, setHistory] = useState<PlannerRun[]>([])
  const [selectedRun, setSelectedRun] = useState<PlannerRun | null>(null)

  useEffect(() => {
    setHistory(getPlannerHistory())
  }, [])

  const handleDeleteRun = (runId: string) => {
    const updatedHistory = history.filter((run) => run.id !== runId)
    setHistory(updatedHistory)
    localStorage.setItem("planner-history", JSON.stringify(updatedHistory))

    if (selectedRun?.id === runId) {
      setSelectedRun(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text mb-2 text-balance">Planning History</h1>
        <p className="text-muted">Review and analyze previous fleet allocation plans</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-bg-hover rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-muted" />
          </div>
          <h3 className="text-lg font-medium text-text mb-2">No Planning History</h3>
          <p className="text-muted">Generate your first fleet allocation plan to see it appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* History List */}
          <div className="lg:col-span-1">
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-text">Recent Plans</h2>
              </div>
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {history.map((run) => (
                  <div
                    key={run.id}
                    className={`p-4 cursor-pointer hover:bg-bg-hover transition-colors ${
                      selectedRun?.id === run.id ? "bg-bg-hover" : ""
                    }`}
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text truncate">
                          Plan #{run.id.split("-")[1]?.slice(-4) || "Unknown"}
                        </p>
                        <p className="text-xs text-muted mt-1">{formatDate(run.timestamp)}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {run.summary.totalSelected}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {run.summary.averageScore}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRun(run.id)
                        }}
                        className="p-1 rounded-md hover:bg-background transition-colors text-muted hover:text-red-600 dark:hover:text-red-400"
                        aria-label="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="lg:col-span-2">
            {selectedRun ? (
              <div className="space-y-6">
                {/* Plan Summary */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text">Plan Details</h2>
                    <span className="text-sm text-muted">{formatDate(selectedRun.timestamp)}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text">{selectedRun.summary.totalSelected}</p>
                      <p className="text-sm text-muted">Selected Trainsets</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text">{selectedRun.summary.averageScore}</p>
                      <p className="text-sm text-muted">Average Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-text">{selectedRun.summary.averageConfidence}%</p>
                      <p className="text-sm text-muted">Confidence</p>
                    </div>
                  </div>

                  {/* Parameters Used */}
                  <div className="border-t border-border pt-4">
                    <h3 className="font-medium text-text mb-3">Parameters Used</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">Max Trainsets:</span>
                        <span className="text-text">{selectedRun.params.maxTrains}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Min Fitness Days:</span>
                        <span className="text-text">{selectedRun.params.minFitnessDays}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">Require Cleaning:</span>
                        <span className="text-text">{selectedRun.params.requireCleaningSlots ? "Yes" : "No"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">High Mileage Priority:</span>
                        <span className="text-text">{selectedRun.params.prioritizeHighMileage ? "Yes" : "No"}</span>
                      </div>
                      <div className="col-span-2 flex justify-between">
                        <span className="text-muted">Excluded Status:</span>
                        <span className="text-text">
                          {selectedRun.params.excludeStatuses.length > 0
                            ? selectedRun.params.excludeStatuses.join(", ")
                            : "None"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Trainsets */}
                <div className="bg-surface border border-border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <h3 className="font-semibold text-text">Selected Trainsets</h3>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedRun.results
                      .filter((result) => result.selected)
                      .map((result) => (
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

                {/* All Results Summary */}
                <div className="bg-surface border border-border rounded-lg p-6">
                  <h3 className="font-semibold text-text mb-4">Evaluation Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-text">
                        {selectedRun.results.filter((r) => r.selected).length}
                      </p>
                      <p className="text-xs text-muted">Selected</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">
                        {selectedRun.results.filter((r) => !r.selected && r.score >= 70).length}
                      </p>
                      <p className="text-xs text-muted">High Score</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">
                        {selectedRun.results.filter((r) => r.score < 50).length}
                      </p>
                      <p className="text-xs text-muted">Low Score</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text">{selectedRun.results.length}</p>
                      <p className="text-xs text-muted">Total Evaluated</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-lg p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-bg-hover rounded-full flex items-center justify-center">
                  <Eye className="w-8 h-8 text-muted" />
                </div>
                <h3 className="text-lg font-medium text-text mb-2">Select a Plan</h3>
                <p className="text-muted">Choose a plan from the history to view its details and results</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
