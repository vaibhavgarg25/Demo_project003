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
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              aria-label="Close details"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white dark:bg-gray-900">
            {/* Status Overview */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Fitness Expiry</span>
                </div>
                <p
                  className={`font-medium ${fitnessExpiry !== null && fitnessExpiry < 7 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white"}`}
                >
                  {fitnessExpiry !== null ? (fitnessExpiry > 0 ? `${fitnessExpiry} days` : "Expired") : "No data"}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Wrench className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Open Jobs</span>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{openJobCards.length}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Mileage</span>
                    <span className="text-gray-900 dark:text-white">
                      {typeof trainset.mileage === "number"
                        ? trainset.mileage.toLocaleString()
                        : typeof trainset.mileage === "object" && trainset.mileage?.totalMileageKM
                          ? trainset.mileage.totalMileageKM.toLocaleString()
                          : 0}{" "}
                      km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Position</span>
                    <span className="text-gray-900 dark:text-white">{trainset.stabling_position || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Cleaning</span>
                    <span className="text-gray-900 dark:text-white">{trainset.cleaning_schedule || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Branding</span>
                    <span className="text-gray-900 dark:text-white">{trainset.branding_status || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Priority Score</span>
                    <span className="text-gray-900 dark:text-white">{trainset.priority_score || 0}/100</span>
                  </div>
                </div>
              </div>

              {/* Job Cards */}
              {openJobCards.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Open Job Cards</h3>
                  <div className="space-y-2">
                    {openJobCards.map((job) => (
                      <div
                        key={job.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{job.id}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{job.description}</p>
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
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
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Maintenance History</h3>
                  <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <Suspense fallback={<div className="h-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />}>
                      <AreaChart data={maintenanceChartData} />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-2 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                  Schedule Maintenance
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
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
