"use client"
import { X, Calendar, Wrench, Briefcase, Palette, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import type { Trainset } from "@/lib/mock-data"

interface TrainsetModalProps {
  isOpen: boolean
  onClose: () => void
  trainset: Trainset
}

export function TrainsetModal({ isOpen, onClose, trainset }: TrainsetModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration by ensuring component only renders after client mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isOpen || !isMounted) return null

  // return CSS variable names for use in inline styles
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { background: "var(--accent)", color: "var(--accent-foreground)" }
      case "maintenance":
        return { background: "var(--secondary)", color: "var(--secondary-foreground)" }
      case "out of service":
        return { background: "var(--destructive)", color: "var(--destructive-foreground)" }
      default:
        return { background: "var(--muted)", color: "var(--muted-foreground)" }
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return { background: "var(--muted)", color: "var(--muted-foreground)" }

    switch (priority.toLowerCase()) {
      case "high priority":
        return { background: "var(--destructive)", color: "var(--destructive-foreground)" }
      case "medium priority":
        return { background: "var(--secondary)", color: "var(--secondary-foreground)" }
      case "low priority":
        return { background: "var(--accent)", color: "var(--accent-foreground)" }
      default:
        return { background: "var(--muted)", color: "var(--muted-foreground)" }
    }
  }

  // Safe access to nested properties with fallbacks
  const jobCardStatus = trainset.jobCardStatus || {}
  const cleaningStatus = (trainset as any).cleaning_status || {}
  const maintenanceHistory = trainset.maintenance_history || {}
  const brandingStatus = trainset.branding_status || {}

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ color: "var(--foreground)" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl mx-4"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          borderRadius: "0.5rem",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h2 style={{ color: "var(--foreground)" }} className="text-2xl font-bold">
              {trainset.id} - {trainset.trainname}
            </h2>
            <p className="mt-1" style={{ color: "var(--muted-foreground)" }}>
              Detailed trainset information and status
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-current"
            style={{
              color: "var(--muted-foreground)",
            }}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Briefcase className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Status:</span>
                  <Badge
                    style={{
                      backgroundColor: getStatusColor(trainset.status).background,
                      color: getStatusColor(trainset.status).color,
                      borderRadius: "0.35rem",
                    }}
                  >
                    {trainset.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Location:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {trainset.stabling_position || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Availability:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {trainset.availability_confidence || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Job Cards */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Wrench className="w-5 h-5" />
                Job Cards
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Open:</span>
                  <Badge
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.35rem",
                    }}
                  >
                    {typeof jobCardStatus === "object" && "openJobCards" in jobCardStatus ? jobCardStatus.openJobCards : 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Pending:</span>
                  <Badge
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.35rem",
                    }}
                  >
                    {typeof jobCardStatus === "object" && "pendingJobCards" in jobCardStatus ? (jobCardStatus as any).pendingJobCards : 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Closed:</span>
                  <Badge
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.35rem",
                    }}
                  >
                    {typeof jobCardStatus === "object" && "closedJobCards" in jobCardStatus ? jobCardStatus.closedJobCards : 0}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Cleaning Status */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Sparkles className="w-5 h-5" />
                Cleaning Status
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Last Cleaned:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof cleaningStatus === "object" && "lastCleaned" in cleaningStatus ? (cleaningStatus as any).lastCleaned : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Next Scheduled:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof cleaningStatus === "object" && "nextCleaning" in cleaningStatus ? (cleaningStatus as any).nextCleaning : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Detail Level:</span>
                  <Badge
                    variant="outline"
                    className="px-3 py-1"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--foreground)",
                      border: "1px solid var(--border)",
                      borderRadius: "0.35rem",
                    }}
                  >
                    {typeof cleaningStatus === "object" && "detailLevel" in cleaningStatus ? (cleaningStatus as any).detailLevel : "N/A"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance & Branding */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Calendar className="w-5 h-5" />
                Maintenance
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Last Service:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof maintenanceHistory === "object" && "lastService" in maintenanceHistory ? (maintenanceHistory as any).lastService : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Next Service:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof maintenanceHistory === "object" && "nextService" in maintenanceHistory ? (maintenanceHistory as any).nextService : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Fitness Expiry:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {(trainset as any).fitness_expiry || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Mileage:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof trainset.mileage === "number" ? `${trainset.mileage} km` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Palette className="w-5 h-5" />
                Branding
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Type:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof brandingStatus === "object" && "type" in brandingStatus ? (brandingStatus as any).type : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Priority:</span>
                  <Badge
                    style={{
                      backgroundColor: getPriorityColor(
                        typeof brandingStatus === "object" && "priority" in brandingStatus
                          ? (brandingStatus as any).priority
                          : undefined
                      ).background,
                      color: getPriorityColor(
                        typeof brandingStatus === "object" && "priority" in brandingStatus
                          ? (brandingStatus as any).priority
                          : undefined
                      ).color,
                      borderRadius: "0.35rem",
                    }}
                  >
                    {typeof brandingStatus === "object" && "priority" in brandingStatus
                      ? (brandingStatus as any).priority || "N/A"
                      : "N/A"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: "var(--muted-foreground)" }}>Expires:</span>
                  <span className="font-medium" style={{ color: "var(--foreground)" }}>
                    {typeof brandingStatus === "object" && "expiry" in brandingStatus ? (brandingStatus as any).expiry : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Fleet Status */}
            <div
              className="rounded-lg p-4"
              style={{
                backgroundColor: "var(--muted)",
                color: "var(--muted-foreground)",
                borderRadius: "0.5rem",
              }}
            >
              <h4 className="font-semibold mb-3" style={{ color: "var(--foreground)" }}>
                Fleet Status
              </h4>
              <div className="flex items-center justify-center mb-4">
                <div
                  className="w-24 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "var(--border)" }}
                >
                  <div style={{ width: 64, height: 24, backgroundColor: "var(--muted-foreground)", borderRadius: 4 }} />
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  25
                </div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Active Trainsets
                </div>
                <div className="flex justify-between text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                  <span>0 Standby</span>
                  <span>0 Maintenance</span>
                  <span>0 Out of Service</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6" style={{ borderTop: "1px solid var(--border)" }}>
          <Button
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
            style={{
              color: "var(--foreground)",
              borderColor: "var(--border)",
            }}
          >
            <Calendar className="w-4 h-4" />
            Schedule Maintenance
          </Button>
          <Button style={{ backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Full History
          </Button>
        </div>
      </div>
    </div>
  )
}
