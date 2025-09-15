import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, Clock, CheckCircle } from "lucide-react"

const benefits = [
  {
    icon: TrendingUp,
    title: "Higher fleet availability",
    description: "Maximize operational uptime",
  },
  {
    icon: DollarSign,
    title: "Lower lifecycle costs",
    description: "Optimize maintenance spending",
  },
  {
    icon: Clock,
    title: "Fewer errors, higher punctuality",
    description: "Improve service reliability",
  },
  {
    icon: CheckCircle,
    title: "Advertiser SLA compliance",
    description: "Meet contractual obligations",
  },
]

export function BenefitsSection() {
  return (
    <section className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl mb-4">How It Helps</h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Transform your fleet operations with data-driven insights
            </p>
          </div>

          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Benefits List */}
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={benefit.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    <benefit.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Illustration */}
            <div className="relative">
              <Card className="overflow-hidden shadow-2xl">
                <CardContent className="p-0">
                  <div className="bg-gradient-to-br from-primary/5 to-secondary/5 p-6">
                    {/* Mock Dashboard Header */}
                    <div className="mb-6 flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Fleet Induction Dashboard</h3>
                      <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-secondary"></div>
                        <div className="h-3 w-3 rounded-full bg-primary"></div>
                      </div>
                    </div>

                    {/* Mock Charts */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-2xl font-bold text-primary">94%</div>
                          <div className="text-xs text-muted-foreground">Availability</div>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-2xl font-bold text-secondary">12</div>
                          <div className="text-xs text-muted-foreground">Active Trains</div>
                        </div>
                        <div className="rounded-lg bg-background p-3 text-center">
                          <div className="text-2xl font-bold text-primary">8.2</div>
                          <div className="text-xs text-muted-foreground">Avg Score</div>
                        </div>
                      </div>

                      {/* Mock Train List */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-secondary"></div>
                            <span className="font-medium">Train KM-001</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Ready</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary"></div>
                            <span className="font-medium">Train KM-002</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Maintenance</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-secondary"></div>
                            <span className="font-medium">Train KM-003</span>
                          </div>
                          <span className="text-sm text-muted-foreground">Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
