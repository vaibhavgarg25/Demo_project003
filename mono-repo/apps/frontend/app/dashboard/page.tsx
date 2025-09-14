import { Suspense } from "react"
import { KpiTile } from "@/components/KpiTile"
import { RecommendationCard } from "@/components/RecommendationCard"
import { AnimatedTrain } from "@/components/AnimatedTrain"
import { TRAINSETS } from "@/lib/mock-data"
import { daysUntil } from "@/lib/utils"

export default function Dashboard() {
  // Calculate KPIs
  const totalTrainsets = TRAINSETS.length
  const activeTrainsets = TRAINSETS.filter((t) => t.status === "Active").length
  const maintenanceTrainsets = TRAINSETS.filter((t) => t.status === "Maintenance").length
  const availabilityRate = Math.round((activeTrainsets / totalTrainsets) * 100)

  // Fitness expiring soon
  const fitnessExpiringSoon = TRAINSETS.filter((t) => {
    const days = daysUntil(t.fitness_certificate.expiry_date)
    return days <= 30 && days > 0
  }).length

  // Average mileage
  const avgMileage = Math.round(TRAINSETS.reduce((sum, t) => sum + t.mileage, 0) / totalTrainsets)

  // Open job cards
  const totalOpenJobs = TRAINSETS.reduce((sum, t) => sum + t.job_cards.filter((j) => j.status === "open").length, 0)

  // Mock sparkline data
  const availabilityTrend = [92, 89, 94, 91, 95, 93, 96, 94, 97, 95, 98, 96]
  const mileageTrend = [42000, 42500, 43000, 43200, 43800, 44100, 44500, 44800, 45200, 45600, 46000, 46200]
  const maintenanceTrend = [3, 2, 4, 3, 2, 3, 4, 2, 3, 2, 3, 2]

  // Top recommendations (highest priority scores)
  const topRecommendations = TRAINSETS.filter((t) => t.status === "Active" || t.status === "Standby")
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 3)
    .map((trainset) => ({
      trainset,
      reason: getRecommendationReason(trainset),
      confidence: trainset.availability_confidence || trainset.priority_score,
    }))

  // Earliest fitness expiry (next 5)
  const upcomingFitness = TRAINSETS.map((t) => ({
    ...t,
    daysUntilExpiry: daysUntil(t.fitness_certificate.expiry_date),
  }))
    .filter((t) => t.daysUntilExpiry > 0)
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiTile
          title="Fleet Availability"
          value={`${availabilityRate}%`}
          subtitle={`${activeTrainsets}/${totalTrainsets} active`}
          progress={availabilityRate}
          sparklineData={availabilityTrend}
          trend="up"
        />

        <KpiTile
          title="Average Mileage"
          value={`${avgMileage.toLocaleString()}`}
          subtitle="km per trainset"
          sparklineData={mileageTrend.map((m) => m / 1000)}
          trend="neutral"
        />

        <KpiTile
          title="In Maintenance"
          value={maintenanceTrainsets}
          subtitle={`${Math.round((maintenanceTrainsets / totalTrainsets) * 100)}% of fleet`}
          progress={Math.round((maintenanceTrainsets / totalTrainsets) * 100)}
          sparklineData={maintenanceTrend}
          trend="down"
        />

        <KpiTile
          title="Open Job Cards"
          value={totalOpenJobs}
          subtitle={`${fitnessExpiringSoon} fitness expiring`}
          trend={totalOpenJobs > 10 ? "up" : "neutral"}
        />
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recommendations Column */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Recommended for Service</h2>
            <div className="space-y-4">
              {topRecommendations.map((rec) => (
                <RecommendationCard
                  key={rec.trainset.id}
                  trainset={rec.trainset}
                  reason={rec.reason}
                  confidence={rec.confidence}
                />
              ))}
            </div>
          </div>

          {/* Upcoming Fitness Renewals */}
          <div>
            <h2 className="text-lg font-semibold text-text mb-4 text-balance">Upcoming Fitness Renewals</h2>
            <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
              <div className="divide-y divide-border">
                {upcomingFitness.map((trainset) => (
                  <div
                    key={trainset.id}
                    className="p-4 flex items-center justify-between hover:bg-hover transition-colors"
                  >
                    <div>
                      <p className="font-medium text-text">{trainset.id}</p>
                      <p className="text-sm text-muted">{trainset.stabling_position}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${trainset.daysUntilExpiry < 7 ? "text-red-600 dark:text-red-400" : "text-text"}`}
                      >
                        {trainset.daysUntilExpiry} days
                      </p>
                      <p className="text-xs text-muted">
                        {new Date(trainset.fitness_certificate.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Animated Train Hero */}
        <div className="bg-surface border border-border rounded-xl shadow-md p-6 flex flex-col items-center justify-center hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
          <h3 className="text-lg font-semibold text-text mb-4 text-balance text-center">Fleet Status</h3>

          <Suspense fallback={<div className="w-48 h-20 bg-border rounded-lg animate-pulse" />}>
            <AnimatedTrain />
          </Suspense>

          <div className="mt-6 text-center">
            <p className="text-2xl font-bold text-text">{activeTrainsets}</p>
            <p className="text-sm text-muted">Active Trainsets</p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-center text-xs">
            <div>
              <p className="font-medium text-text">{TRAINSETS.filter((t) => t.status === "Standby").length}</p>
              <p className="text-muted">Standby</p>
            </div>
            <div>
              <p className="font-medium text-text">{maintenanceTrainsets}</p>
              <p className="text-muted">Maintenance</p>
            </div>
            <div>
              <p className="font-medium text-text">{TRAINSETS.filter((t) => t.status === "OutOfService").length}</p>
              <p className="text-muted">Out of Service</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getRecommendationReason(trainset: any): string {
  const openJobs = trainset.job_cards.filter((j: any) => j.status === "open").length
  const fitnessExpiry = daysUntil(trainset.fitness_certificate.expiry_date)

  if (fitnessExpiry < 7) return "Fitness certificate expiring soon"
  if (openJobs === 0) return "No pending maintenance, ready for service"
  if (openJobs === 1) return "1 minor job card pending"
  if (trainset.mileage < 40000) return "Low mileage, optimal for service"
  return "Good overall condition"
}
