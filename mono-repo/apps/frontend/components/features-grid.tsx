import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Wrench, Eye, BarChart3, Sparkles, MapPin } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Fitness Check",
    description: "Automated validation of certificates across departments.",
  },
  {
    icon: Wrench,
    title: "Job-Card Sync",
    description: "Real-time Maximo integration for open/closed work orders.",
  },
  {
    icon: Eye,
    title: "Branding Compliance",
    description: "Track advertiser SLAs with exposure-hour visibility.",
  },
  {
    icon: BarChart3,
    title: "Mileage Balancing",
    description: "Distribute kilometres to reduce uneven wear.",
  },
  {
    icon: Sparkles,
    title: "Cleaning & Detailing",
    description: "Manpower and bay slot optimisation.",
  },
  {
    icon: MapPin,
    title: "Stabling Optimiser",
    description: "Minimise nightly shunting and morning delays.",
  },
]

export function FeaturesGrid() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">Key Features</h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Comprehensive fleet management tools designed for metro operations
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50"
            >
              <CardHeader className="pb-4">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
