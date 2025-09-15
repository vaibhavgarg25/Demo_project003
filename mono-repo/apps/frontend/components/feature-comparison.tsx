import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"

const comparisonData = [
  {
    feature: "Real-Time Fleet Tracking",
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Basic Analytics Dashboard",
    basic: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Safety Incident Reporting",
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Predictive Maintenance",
    basic: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Advanced Analytics & AI",
    basic: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "Custom Integrations",
    basic: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "24/7 Priority Support",
    basic: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "Multi-Location Management",
    basic: false,
    professional: false,
    enterprise: true,
  },
]

const plans = [
  {
    name: "Basic",
    description: "Essential fleet management tools",
    price: "₹2,999",
    period: "/month",
    popular: false,
  },
  {
    name: "Professional",
    description: "Advanced features for growing operations",
    price: "₹7,999",
    period: "/month",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Complete solution for large-scale operations",
    price: "Custom",
    period: "pricing",
    popular: false,
  },
]

export function FeatureComparison() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Choose Your Plan</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Compare features across different plans to find the perfect fit for your operation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feature List */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comparisonData.map((item, index) => (
                  <div key={index} className="py-3 text-sm font-medium">
                    {item.feature}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Plan Columns */}
          {plans.map((plan, planIndex) => (
            <div key={planIndex} className="lg:col-span-1">
              <Card className={`h-full ${plan.popular ? "ring-2 ring-primary" : ""}`}>
                <CardHeader className="text-center pb-4">
                  {plan.popular && <Badge className="w-fit mx-auto mb-2">Most Popular</Badge>}
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {comparisonData.map((item, index) => (
                    <div key={index} className="py-3 flex items-center justify-center">
                      {(planIndex === 0 && item.basic) ||
                      (planIndex === 1 && item.professional) ||
                      (planIndex === 2 && item.enterprise) ? (
                        <Check className="h-5 w-5 text-accent" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
