"use client"

import { X, Calendar, Wrench, Briefcase, Palette, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect, useMemo } from "react"
import type { Trainset } from "@/lib/mock-data"

interface TrainsetModalProps {
  isOpen: boolean
  onClose: () => void
  trainset: Trainset
}

export function TrainsetModal({ isOpen, onClose, trainset }: TrainsetModalProps) {
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration by ensuring client-only rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Safe access to nested properties with fallbacks (non-hook values)
  const jobCardStatus = (trainset as any).jobCardStatus || {}
  const cleaningStatus = (trainset as any).cleaning_status || {}
  const maintenanceHistory = (trainset as any).maintenance_history || {}
  const brandingStatus = (trainset as any).branding_status || {}

  // Visual health score (purely presentational) — useMemo is a hook and must run every render
  const healthScore = useMemo(() => {
    const base = Number(trainset.availability_confidence ?? 0)
    const openJobs = Number(jobCardStatus.openJobCards ?? 0)
    const penalty = Math.min(openJobs * 3, 30) // up to -30
    const score = Math.max(0, Math.min(100, Math.round(base - penalty)))
    return score
  }, [trainset.availability_confidence, jobCardStatus.openJobCards])

  // Helper color functions (plain functions — not hooks)
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return { bg: "var(--accent)", fg: "var(--accent-foreground)" }
      case "maintenance":
        return { bg: "var(--secondary)", fg: "var(--secondary-foreground)" }
      case "out of service":
        return { bg: "var(--destructive)", fg: "var(--destructive-foreground)" }
      default:
        return { bg: "var(--muted)", fg: "var(--muted-foreground)" }
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    if (!priority) return { bg: "var(--muted)", fg: "var(--muted-foreground)" }

    switch (priority.toLowerCase()) {
      case "high priority":
        return { bg: "var(--destructive)", fg: "var(--destructive-foreground)" }
      case "medium priority":
        return { bg: "var(--secondary)", fg: "var(--secondary-foreground)" }
      case "low priority":
        return { bg: "var(--accent)", fg: "var(--accent-foreground)" }
      default:
        return { bg: "var(--muted)", fg: "var(--muted-foreground)" }
    }
  }

  // Health gradient helper (plain function)
  const getHealthGradient = (score: number) => {
    if (score >= 75) {
      return `linear-gradient(90deg, var(--accent) 0%, var(--primary) 100%)`
    }
    if (score >= 45) {
      return `linear-gradient(90deg, #F59E0B 0%, var(--secondary) 100%)`
    }
    return `linear-gradient(90deg, var(--destructive) 0%, #F97316 100%)`
  }

  // Small utility to format fallback strings
  const safe = (v: any, fallback = "N/A") => (v !== undefined && v !== null && v !== "" ? v : fallback)

  // Early return only after all hooks have been called
  if (!isOpen || !isMounted) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ color: "var(--foreground)" }}
      aria-labelledby="trainset-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl mx-4"
        style={{
          backgroundColor: "var(--card)",
          color: "var(--card-foreground)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 rounded-t-2xl"
          style={{
            borderBottom: "1px solid var(--border)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)",
          }}
        >
          <div className="flex items-center gap-4">
            {/* Accent strip */}
            <div
              aria-hidden
              style={{
                width: 6,
                height: 52,
                borderRadius: 6,
                background:
                  trainset.status && getStatusColor(trainset.status).bg
                    ? getStatusColor(trainset.status).bg
                    : "var(--muted)",
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            />

            <div>
              <h2 id="trainset-modal-title" style={{ color: "var(--foreground)" }} className="text-2xl font-bold leading-tight">
                {safe(trainset.id, "")} <span style={{ color: "var(--muted-foreground)" }}>—</span>{" "}
                <span style={{ color: "var(--muted-foreground)", fontWeight: 600 }}>{safe(trainset.trainname, "")}</span>
              </h2>
              <p style={{ color: "var(--muted-foreground)", marginTop: 4, fontSize: 13 }}>
                {safe(trainset.stabling_position, "Location unknown")} · {safe(trainset.availability_confidence, "0")}% availability
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status pill */}
            <div
              role="status"
              aria-label={`Status: ${trainset.status}`}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: getStatusColor(trainset.status).bg,
                color: getStatusColor(trainset.status).fg,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
              }}
            >
              {trainset.status ?? "Unknown"}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              style={{ color: "var(--muted-foreground)" }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Main details & job cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Health summary card */}
            <div
              className="rounded-xl p-4"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 style={{ color: "var(--foreground)" }} className="text-lg font-semibold">
                    Health
                  </h3>
                  <p style={{ color: "var(--muted-foreground)", marginTop: 4 }}>Combined availability and job load</p>
                </div>

                {/* numeric ring */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 72, height: 72, position: "relative" }}>
                    <svg viewBox="0 0 36 36" style={{ width: 72, height: 72 }}>
                      <defs>
                        <linearGradient id="ringGrad" x1="0" x2="1">
                          <stop offset="0%" stopColor="var(--accent)" />
                          <stop offset="100%" stopColor="var(--primary)" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831
                         a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="var(--muted-foreground)"
                        strokeWidth="3"
                        opacity="0.12"
                      />
                      <path
                        d="M18 2.0845
                         a 15.9155 15.9155 0 0 1 0 31.831"
                        fill="none"
                        stroke="url(#ringGrad)"
                        strokeWidth="3"
                        strokeDasharray={`${(healthScore / 100) * 100}, 100`}
                        strokeLinecap="round"
                        transform="rotate(-90 18 18)"
                      />
                    </svg>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        fontSize: 13,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "var(--foreground)" }}>{healthScore}%</div>
                      <div style={{ color: "var(--muted-foreground)", fontSize: 11 }}>Health</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* lively health bar */}
              <div style={{ marginTop: 12 }}>
                <div style={{ height: 12, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}>
                  <div
                    role="progressbar"
                    aria-valuenow={healthScore}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={{
                      width: `${healthScore}%`,
                      height: "100%",
                      transition: "width 600ms ease",
                      background: getHealthGradient(healthScore),
                      boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.08)",
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Availability: {trainset.availability_confidence ?? 0}%</div>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Open Jobs: {jobCardStatus.openJobCards ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Job Cards wide view */}
            <div
              className="rounded-xl p-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ color: "var(--foreground)" }} className="text-lg font-semibold">Job Cards</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 6, background: "var(--destructive)" }} />
                    <small style={{ color: "var(--muted-foreground)" }}>Open</small>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 6, background: "var(--secondary)" }} />
                    <small style={{ color: "var(--muted-foreground)" }}>Pending</small>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 6, background: "var(--accent)" }} />
                    <small style={{ color: "var(--muted-foreground)" }}>Closed</small>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div style={{ padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Open</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "var(--destructive)" }}>{jobCardStatus.openJobCards ?? 0}</div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Pending</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "var(--secondary)" }}>{jobCardStatus.pendingJobCards ?? 0}</div>
                </div>

                <div style={{ padding: 12, borderRadius: 12, background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)", border: "1px solid var(--border)" }}>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Closed</div>
                  <div style={{ fontWeight: 700, fontSize: 20, color: "var(--accent)" }}>{jobCardStatus.closedJobCards ?? 0}</div>
                </div>
              </div>
            </div>

            {/* Cleaning & Branding */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Sparkles className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
                  <div>
                    <div style={{ color: "var(--foreground)", fontWeight: 700 }}>Cleaning</div>
                    <div style={{ color: "var(--muted-foreground)", marginTop: 4, fontSize: 13 }}>
                      Last: {typeof cleaningStatus === "object" && "lastCleaned" in cleaningStatus ? (cleaningStatus as any).lastCleaned : "N/A"}
                      {" · "}
                      Next: {typeof cleaningStatus === "object" && "nextCleaning" in cleaningStatus ? (cleaningStatus as any).nextCleaning : "N/A"}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Detail Level</div>
                    <div style={{ marginTop: 6 }}>
                      <Badge
                        style={{
                          backgroundColor: "transparent",
                          color: "var(--foreground)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          padding: "6px 10px",
                        }}
                      >
                        {typeof cleaningStatus === "object" && "detailLevel" in cleaningStatus ? (cleaningStatus as any).detailLevel : "N/A"}
                      </Badge>
                    </div>
                  </div>
                  <div style={{ width: 84, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Crew</div>
                      <div style={{ fontWeight: 700, color: "var(--foreground)" }}>{(cleaningStatus as any).cleaningCrewAssigned ?? "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: 12, borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Palette className="w-5 h-5" style={{ color: "var(--muted-foreground)" }} />
                  <div>
                    <div style={{ color: "var(--foreground)", fontWeight: 700 }}>Branding</div>
                    <div style={{ color: "var(--muted-foreground)", marginTop: 4, fontSize: 13 }}>
                      Type: {typeof brandingStatus === "object" && "type" in brandingStatus ? (brandingStatus as any).type : "N/A"}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Priority</div>
                    <div style={{ marginTop: 6 }}>
                      <Badge
                        style={{
                          backgroundColor: getPriorityColor(
                            typeof brandingStatus === "object" && "priority" in brandingStatus
                              ? (brandingStatus as any).priority
                              : undefined
                          ).bg,
                          color: getPriorityColor(
                            typeof brandingStatus === "object" && "priority" in brandingStatus
                              ? (brandingStatus as any).priority
                              : undefined
                          ).fg,
                          borderRadius: 8,
                          padding: "6px 10px",
                        }}
                      >
                        {typeof brandingStatus === "object" && "priority" in brandingStatus
                          ? (brandingStatus as any).priority || "N/A"
                          : "N/A"}
                      </Badge>
                    </div>
                  </div>

                  <div style={{ width: 96, textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Expires</div>
                    <div style={{ marginTop: 6, fontWeight: 700, color: "var(--foreground)" }}>
                      {typeof brandingStatus === "object" && "expiry" in brandingStatus ? (brandingStatus as any).expiry : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Compact summary / fleet card */}
          <aside>
            <div
              style={{
                padding: 14,
                borderRadius: 14,
                border: "1px solid var(--border)",
                background: "linear-gradient(180deg, rgba(255,255,255,0.02), transparent)",
              }}
            >
              <h4 style={{ color: "var(--foreground)", fontWeight: 700 }}>Maintenance</h4>
              <div style={{ marginTop: 8, color: "var(--muted-foreground)", fontSize: 13 }}>
                Last: {typeof maintenanceHistory === "object" && "lastService" in maintenanceHistory ? (maintenanceHistory as any).lastService : "N/A"}
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Next Service</div>
                  <div style={{ color: "var(--foreground)", fontWeight: 700 }}>{typeof maintenanceHistory === "object" && "nextService" in maintenanceHistory ? (maintenanceHistory as any).nextService : "N/A"}</div>
                </div>
              </div>

              <div style={{ height: 12, marginTop: 12, borderRadius: 8, background: "var(--border)" }}>
                {typeof maintenanceHistory === "object" && (maintenanceHistory as any).service_due_in_days !== undefined ? (
                  <div
                    style={{
                      width: `${Math.max(0, Math.min(100, 100 - ((maintenanceHistory as any).service_due_in_days || 0) / 1))}%`,
                      height: "100%",
                      borderRadius: 8,
                      background: "var(--secondary)",
                      transition: "width 600ms ease",
                    }}
                  />
                ) : (
                  <div style={{ width: "40%", height: "100%", borderRadius: 8, background: "var(--muted-foreground)", opacity: 0.12 }} />
                )}
              </div>

              <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Fitness Expiry</div>
                  <div style={{ color: "var(--foreground)", fontWeight: 700 }}>{(trainset as any).fitness_expiry || "N/A"}</div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>Fleet</div>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="44" height="44" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15" stroke="var(--muted-foreground)" strokeWidth="3" fill="none" opacity="0.12" />
                      <circle cx="18" cy="18" r="15" stroke="var(--accent)" strokeWidth="3" fill="none" strokeDasharray="25,100" transform="rotate(-90 18 18)" />
                    </svg>
                    <div style={{ fontWeight: 700, color: "var(--foreground)" }}>25</div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <Button
                  variant="outline"
                  className="w-full"
                  style={{
                    color: "var(--foreground)",
                    borderColor: "var(--border)",
                    backgroundColor: "transparent",
                    padding: "8px 12px",
                    borderRadius: 10,
                  }}
                >
                  <Calendar className="w-4 h-4" />
                  <span style={{ marginLeft: 8 }}>Schedule Maintenance</span>
                </Button>
              </div>
            </div>
          </aside>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center gap-3 p-4" style={{ borderTop: "1px solid var(--border)" }}>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2"
            style={{
              color: "var(--foreground)",
              borderColor: "var(--border)",
              background: "transparent",
            }}
          >
            Close
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
