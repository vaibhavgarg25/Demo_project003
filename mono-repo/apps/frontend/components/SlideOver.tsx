"use client"

import { X, Calendar, Wrench } from "lucide-react"
import type { Trainset } from "@/lib/mock-data"
import { daysUntil } from "@/lib/utils"
import { Suspense } from "react"
import { AreaChart } from "./charts/AreaChart"

interface SlideOverProps {
  isOpen: boolean
  onClose: () => void
  title: string
  trainset: Trainset
}

export function SlideOver({ isOpen, onClose, title, trainset }: SlideOverProps) {
  if (!isOpen) return null

  const fitnessExpiry = trainset.fitness_certificate?.expiry_date
    ? daysUntil(trainset.fitness_certificate.expiry_date)
    : null
  const openJobCards = trainset.job_cards?.filter((j) => j.status === "open") || []

  const maintenanceChartData =
    trainset.maintenance_history?.map((item, index) => ({
      name: `M${index + 1}`,
      days: item.duration_days,
      date: item.date,
    })) || []

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-background border-l border-border shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-text">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
              aria-label="Close details"
            >
              <X className="w-5 h-5 text-text" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">Fitness Expiry</span>
                </div>
                <p
                  className={`font-medium ${fitnessExpiry !== null && fitnessExpiry < 7 ? "text-red-600 dark:text-red-400" : "text-text"}`}
                >
                  {fitnessExpiry !== null ? (fitnessExpiry > 0 ? `${fitnessExpiry} days` : "Expired") : "No data"}
                </p>
              </div>

              <div className="bg-surface rounded-lg p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-muted" />
                  <span className="text-sm text-muted">Open Jobs</span>
                </div>
                <p className="font-medium text-text">{openJobCards.length}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-text mb-2">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Mileage</span>
                    <span className="text-text">{trainset.mileage?.toLocaleString() || 0} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Position</span>
                    <span className="text-text">{trainset.stabling_position || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Cleaning</span>
                    <span className="text-text">{trainset.cleaning_schedule || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Branding</span>
                    <span className="text-text">{trainset.branding_status || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Priority Score</span>
                    <span className="text-text">{trainset.priority_score || 0}/100</span>
                  </div>
                </div>
              </div>

              {/* Job Cards */}
              {openJobCards.length > 0 && (
                <div>
                  <h3 className="font-medium text-text mb-2">Open Job Cards</h3>
                  <div className="space-y-2">
                    {openJobCards.map((job) => (
                      <div key={job.id} className="bg-surface rounded-lg p-3 border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-text">{job.id}</p>
                            <p className="text-xs text-muted mt-1">{job.description}</p>
                          </div>
                          <span className="text-xs text-muted">
                            {job.created_at ? new Date(job.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance History Chart */}
              {maintenanceChartData.length > 0 && (
                <div>
                  <h3 className="font-medium text-text mb-2">Maintenance History</h3>
                  <div className="h-32 bg-surface rounded-lg border border-border p-4">
                    <Suspense fallback={<div className="h-full bg-border rounded animate-pulse" />}>
                      <AreaChart data={maintenanceChartData} />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 bg-text text-background rounded-md text-sm font-medium hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2">
                  Schedule Maintenance
                </button>
                <button className="px-4 py-2 border border-border rounded-md text-sm font-medium text-text hover:bg-bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2">
                  View Full History
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
