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
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md shadow-xl"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between p-6"
            style={{
              backgroundColor: "var(--card)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md transition-colors focus:outline-none focus:ring-2"
              style={{
                color: "var(--muted-foreground)",
                backgroundColor: "transparent",
              }}
              aria-label="Close details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-y-auto p-6 space-y-6"
            style={{ backgroundColor: "var(--card)" }}
          >
            {/* Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Fitness Expiry
                  </span>
                </div>
                <p
                  className="font-medium"
                  style={{
                    color:
                      fitnessExpiry !== null && fitnessExpiry < 7
                        ? "var(--destructive)"
                        : "var(--foreground)",
                  }}
                >
                  {fitnessExpiry !== null ? (fitnessExpiry > 0 ? `${fitnessExpiry} days` : "Expired") : "No data"}
                </p>
              </div>

              <div
                className="rounded-lg p-4"
                style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Open Jobs
                  </span>
                </div>
                <p className="font-medium" style={{ color: "var(--foreground)" }}>
                  {openJobCards.length}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2" style={{ color: "var(--foreground)" }}>
                  Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Mileage</span>
                    <span style={{ color: "var(--foreground)" }}>
                      {typeof trainset.mileage === "number"
                        ? trainset.mileage.toLocaleString()
                        : typeof trainset.mileage === "object" && trainset.mileage?.totalMileageKM
                        ? trainset.mileage.totalMileageKM.toLocaleString()
                        : 0}{" "}
                      km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Position</span>
                    <span style={{ color: "var(--foreground)" }}>{trainset.stabling_position || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Cleaning</span>
                    <span style={{ color: "var(--foreground)" }}>{trainset.cleaning_schedule || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Branding</span>
                    <span style={{ color: "var(--foreground)" }}>{trainset.branding_status || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Priority Score</span>
                    <span style={{ color: "var(--foreground)" }}>{trainset.priority_score || 0}/100</span>
                  </div>
                </div>
              </div>

              {/* Job Cards */}
              {openJobCards.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2" style={{ color: "var(--foreground)" }}>
                    Open Job Cards
                  </h3>
                  <div className="space-y-2">
                    {openJobCards.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-lg p-3"
                        style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                              {job.id}
                            </p>
                            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                              {job.description}
                            </p>
                          </div>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {job.created_at ? new Date(job.created_at).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Maintenance History */}
              {maintenanceChartData.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2" style={{ color: "var(--foreground)" }}>
                    Maintenance History
                  </h3>
                  <div
                    className="h-32 rounded-lg p-4"
                    style={{ backgroundColor: "var(--muted)", border: "1px solid var(--border)" }}
                  >
                    <Suspense
                      fallback={
                        <div
                          className="h-full rounded animate-pulse"
                          style={{ backgroundColor: "var(--border)" }}
                        />
                      }
                    >
                      <AreaChart data={maintenanceChartData} />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--primary-foreground)",
                  }}
                >
                  Schedule Maintenance
                </button>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
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
