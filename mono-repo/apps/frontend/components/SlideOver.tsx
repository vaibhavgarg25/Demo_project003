// components/SlideOver.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { X, Calendar, Wrench, Clock, BarChart2 } from "lucide-react";
import type { Trainset } from "@/lib/mock-data";
import { daysUntil } from "@/lib/utils";
import CircularProgress from "./CircularProgress";
import { Suspense } from "react";
import { AreaChart } from "./charts/AreaChart";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  trainset: Trainset;
}

function daysUntilSafe(d?: string | Date | null) {
  if (!d) return Infinity;
  if (typeof d === "string") return daysUntil(d);
  if (d instanceof Date) return daysUntil(d.toISOString());
  return daysUntil(String(d));
}

function getOpenJobCards(trainset: any) {
  if (!trainset) return [];
  if (Array.isArray(trainset.job_cards)) {
    return trainset.job_cards.filter((j: any) => {
      const s = (j.status ?? "").toString().toLowerCase();
      return s === "open";
    });
  }
  if (trainset.jobCardStatus && typeof trainset.jobCardStatus.openJobCards === "number") {
    const n = trainset.jobCardStatus.openJobCards;
    return Array.from({ length: n }).map((_, i) => ({ id: `synthetic-${i + 1}`, description: "Open job", created_at: null }));
  }
  return [];
}

function getMaintenanceHistory(trainset: any) {
  if (!trainset) return [];
  if (Array.isArray(trainset.maintenance_history)) return trainset.maintenance_history;
  if (Array.isArray(trainset.maintenance)) return trainset.maintenance;
  return [];
}

export function SlideOver({ isOpen, onClose, title, trainset }: SlideOverProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const openJobCards = getOpenJobCards(trainset as any);
  const maintenanceHistory = getMaintenanceHistory(trainset as any).map((m: any, i: number) => ({
    name: m.name ?? `M${i + 1}`,
    days: typeof m.duration_days === "number" ? m.duration_days : typeof m.days === "number" ? m.days : 0,
    date: m.date ?? m.performedAt ?? null,
  }));

  const mileage =
    typeof (trainset as any).mileage === "number"
      ? (trainset as any).mileage
      : (trainset as any).mileage?.totalMileageKM ??
        (trainset as any).mileage?.mileageSinceLastServiceKM ??
        0;

  const expiryCandidates = [
    (trainset as any).fitness?.rollingStockFitnessExpiryDate,
    (trainset as any).fitness?.signallingFitnessExpiryDate,
    (trainset as any).fitness?.telecomFitnessExpiryDate,
    (trainset as any).fitness_certificate?.expiry_date,
  ].filter(Boolean);

  const minExpiryDays = expiryCandidates.length ? Math.min(...expiryCandidates.map((d: any) => daysUntilSafe(d))) : Infinity;

  const openCount = openJobCards.length;
  const status = (trainset as any).operations?.operationalStatus ?? (trainset as any).status ?? "unknown";
  const bay = (trainset as any).stabling?.bayPositionID ?? (trainset as any).stabling_position ?? (trainset as any).bay ?? "N/A";

  const priorityScore =
    typeof (trainset as any).priority_score === "number"
      ? (trainset as any).priority_score
      : Math.round(Math.max(0, Math.min(100, 70 + openCount * 2 - (minExpiryDays <= 0 ? 30 : 0))));

  const formatDate = (d?: string | Date | null) => {
    if (!d) return "N/A";
    try {
      const dt = typeof d === "string" ? new Date(d) : (d as Date);
      if (Number.isNaN(dt.getTime())) return "N/A";
      return dt.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  // Hard-coded color / spacing values (no CSS variables)
  const colors = {
    backdrop: "rgba(0,0,0,0.65)",
    panelBg: "#071228", // deep navy for slide-over
    panelText: "#E6EEF6",
    panelBorder: "rgba(255,255,255,0.04)",
    cardBg: "#0C1B2A",
    cardBgSoft: "#0F2434",
    mutedText: "#98A3B3",
    accent: "#06B6A4", // teal
    buttonAccentBg: "#06B6A4",
    buttonAccentHover: "#059787",
    subtleBorder: "rgba(255,255,255,0.03)",
    pillBg: "rgba(255,255,255,0.04)",
    danger: "#FF6B6B",
    shadow: "0 20px 60px rgba(2,6,23,0.6)",
  };

  // Inline styles for major elements
  const styles = {
    backdrop: { position: "fixed" as const, inset: 0, background: colors.backdrop, backdropFilter: "blur(6px)", zIndex: 50 },
    panelWrapper: { position: "fixed" as const, inset: 0, display: "flex", justifyContent: "flex-end", zIndex: 60 },
    panel: {
      width: "min(920px, 92vw)",
      height: "100vh",
      background: colors.panelBg,
      color: colors.panelText,
      boxShadow: colors.shadow,
      borderLeft: `1px solid ${colors.panelBorder}`,
      overflowY: "auto" as const,
      WebkitOverflowScrolling: "touch" as const,
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px",
      borderBottom: `1px solid ${colors.panelBorder}`,
      background: colors.panelBg,
    },
    content: { padding: 24 },
    statCard: {
      borderRadius: 12,
      padding: 16,
      background: colors.cardBgSoft,
      border: `1px solid ${colors.subtleBorder}`,
      minHeight: 88,
    },
    actionPrimary: {
      background: colors.buttonAccentBg,
      color: "#042425",
      border: "none",
      padding: "8px 12px",
      borderRadius: 8,
      cursor: "pointer",
      fontWeight: 600,
    },
    actionPrimaryHover: {
      background: colors.buttonAccentHover,
    },
    mutedTextStyle: { color: colors.mutedText },
    sectionCard: {
      borderRadius: 12,
      padding: 12,
      background: colors.cardBg,
      border: `1px solid ${colors.subtleBorder}`,
    },
  };

  return (
    <div aria-hidden={false} role="dialog" aria-label={`Details for ${title}`}>
      {/* Backdrop */}
      <div style={styles.backdrop} onClick={onClose} />

      {/* Panel wrapper */}
      <div style={styles.panelWrapper}>
        <aside ref={panelRef} style={styles.panel} aria-labelledby="slideover-title">
          {/* Header */}
          <div style={styles.header}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <h2 id="slideover-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.panelText }}>
                  {title}
                </h2>
                <div style={{ fontSize: 12, color: colors.mutedText, marginTop: 4 }}>
                  {(trainset as any).trainID ?? ""}
                </div>
              </div>

              {/* Priority circular */}
              <div style={{ marginLeft: 8, display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 72, height: 72 }}>
                    <CircularProgress value={priorityScore} size={72} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 12, color: colors.mutedText }}>Priority</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: colors.panelText }}>{priorityScore}/100</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  background: "transparent",
                  border: "none",
                  color: colors.mutedText,
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div style={styles.content}>
            {/* Quick stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={styles.statCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Calendar style={{ width: 16, height: 16, color: colors.mutedText }} />
                  <div style={{ fontSize: 12, color: colors.mutedText }}>Fitness expiry</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: colors.panelText }}>
                  {minExpiryDays === Infinity ? "No data" : minExpiryDays <= 0 ? "Expired" : `${minExpiryDays} days`}
                </div>
                {minExpiryDays !== Infinity && minExpiryDays > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12, color: colors.mutedText }}>{formatDate(expiryCandidates[0])}</div>
                )}
              </div>

              <div style={styles.statCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Wrench style={{ width: 16, height: 16, color: colors.mutedText }} />
                  <div style={{ fontSize: 12, color: colors.mutedText }}>Open jobs</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: colors.panelText }}>{openCount}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: colors.mutedText }}>{openCount > 0 ? "Needs action" : "No open jobs"}</div>
              </div>

              <div style={styles.statCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Clock style={{ width: 16, height: 16, color: colors.mutedText }} />
                  <div style={{ fontSize: 12, color: colors.mutedText }}>Mileage</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 15, fontWeight: 700, color: colors.panelText }}>{Number(mileage || 0).toLocaleString()} km</div>
                <div style={{ marginTop: 6, fontSize: 12, color: colors.mutedText }}>Bay {bay}</div>
              </div>
            </div>

            {/* Recommended action */}
            <div style={{ marginTop: 18 }}>
              <div style={{ ...styles.sectionCard }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.panelText }}>Recommended Action</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: colors.mutedText }}>
                      {(trainset as any).recommendation ?? (trainset as any).reason ?? "Inspect train and close high-priority job cards."}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        /* hook into scheduling */
                      }}
                      style={{
                        ...styles.actionPrimary,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <BarChart2 style={{ width: 16, height: 16 }} />
                      Schedule maintenance
                    </button>

                    <button
                      onClick={() => {
                        /* view full history */
                      }}
                      style={{
                        borderRadius: 8,
                        padding: "8px 12px",
                        background: "transparent",
                        border: `1px solid ${colors.subtleBorder}`,
                        color: colors.panelText,
                        cursor: "pointer",
                      }}
                    >
                      View full history
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Open job cards */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.panelText, marginBottom: 10 }}>Open job cards</div>
              {openCount === 0 ? (
                <div style={{ color: colors.mutedText }}>No open job cards.</div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {openJobCards.map((job: any, idx: number) => (
                    <div
                      key={job.id ?? idx}
                      style={{
                        borderRadius: 10,
                        padding: 12,
                        background: colors.cardBg,
                        border: `1px solid ${colors.subtleBorder}`,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: colors.panelText }}>
                            {job.title ?? job.summary ?? `Job ${job.id ?? idx + 1}`}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 12, color: colors.mutedText }}>
                            {job.description ?? job.notes ?? "No description"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", color: colors.mutedText, fontSize: 12 }}>
                          <div>{job.created_at ? formatDate(job.created_at) : "—"}</div>
                          <div style={{ marginTop: 8 }}>
                            <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 999, background: "rgba(255,167,52,0.12)", color: "#FFB86B", fontSize: 12 }}>
                              Open
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Maintenance history */}
            <div style={{ marginTop: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: colors.panelText, marginBottom: 10 }}>Maintenance history</div>
              {maintenanceHistory.length === 0 ? (
                <div style={{ color: colors.mutedText }}>No maintenance records available.</div>
              ) : (
                <div style={{ borderRadius: 12, padding: 12, background: colors.cardBg, border: `1px solid ${colors.subtleBorder}` }}>
                  <div style={{ height: 180 }}>
                    <Suspense fallback={<div style={{ height: "100%", background: "#071228" }} />}>
                      <AreaChart data={maintenanceHistory} />
                    </Suspense>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default SlideOver;
