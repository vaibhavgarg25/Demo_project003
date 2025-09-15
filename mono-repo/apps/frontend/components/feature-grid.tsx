import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  Shield,
  BarChart3,
  Users,
  MapPin,
  Clock,
  Wrench,
  Database,
  Bell,
  Smartphone,
  FileText,
  Settings,
} from "lucide-react"

const features = [
  {
    icon: Activity,
    title: "Real-Time Monitoring",
    description:
      "Track fleet status, performance metrics, and operational data in real-time with advanced analytics dashboard.",
    category: "Operations",
    benefits: ["Live fleet tracking", "Performance analytics", "Instant alerts"],
  },
  {
    icon: Shield,
    title: "Safety Management",
    description:
      "Comprehensive safety protocols, incident reporting, and compliance tracking to ensure passenger and staff safety.",
    category: "Safety",
    benefits: ["Incident tracking", "Safety compliance", "Emergency protocols"],
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description:
      "Generate detailed reports on fleet utilization, maintenance schedules, and operational efficiency metrics.",
    category: "Analytics",
    benefits: ["Custom reports", "Data visualization", "Trend analysis"],
  },
  {
    icon: Users,
    title: "Staff Management",
    description: "Manage driver schedules, training records, and performance evaluations with integrated HR tools.",
    category: "Management",
    benefits: ["Schedule management", "Training tracking", "Performance reviews"],
  },
  {
    icon: MapPin,
    title: "Route Optimization",
    description: "AI-powered route planning and optimization to reduce travel time and improve passenger experience.",
    category: "Operations",
    benefits: ["Smart routing", "Traffic analysis", "Time optimization"],
  },
  {
    icon: Clock,
    title: "Predictive Maintenance",
    description:
      "Proactive maintenance scheduling based on usage patterns and predictive analytics to prevent breakdowns.",
    category: "Maintenance",
    benefits: ["Predictive alerts", "Maintenance scheduling", "Cost reduction"],
  },
  {
    icon: Wrench,
    title: "Asset Management",
    description:
      "Complete lifecycle management of fleet assets including procurement, deployment, and retirement tracking.",
    category: "Management",
    benefits: ["Asset tracking", "Lifecycle management", "Inventory control"],
  },
  {
    icon: Database,
    title: "Data Integration",
    description:
      "Seamless integration with existing systems and third-party services for comprehensive data management.",
    category: "Integration",
    benefits: ["API connectivity", "Data synchronization", "System integration"],
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description: "Intelligent alert system for critical events, maintenance reminders, and operational updates.",
    category: "Communication",
    benefits: ["Smart alerts", "Custom notifications", "Multi-channel delivery"],
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Full-featured mobile application for on-the-go fleet management and real-time decision making.",
    category: "Accessibility",
    benefits: ["Mobile app", "Offline access", "Cross-platform support"],
  },
  {
    icon: FileText,
    title: "Document Management",
    description:
      "Centralized document storage and management for compliance, training materials, and operational procedures.",
    category: "Documentation",
    benefits: ["Document storage", "Version control", "Access management"],
  },
  {
    icon: Settings,
    title: "System Configuration",
    description:
      "Flexible system configuration options to adapt the platform to your specific operational requirements.",
    category: "Customization",
    benefits: ["Custom workflows", "Role-based access", "Flexible configuration"],
  },
]

const categoryColors = {
  Operations: "bg-primary/10 text-primary",
  Safety: "bg-destructive/10 text-destructive",
  Analytics: "bg-accent/10 text-accent",
  Management: "bg-secondary/10 text-secondary",
  Maintenance: "bg-chart-1/10 text-chart-1",
  Integration: "bg-chart-2/10 text-chart-2",
  Communication: "bg-chart-3/10 text-chart-3",
  Accessibility: "bg-chart-4/10 text-chart-4",
  Documentation: "bg-chart-5/10 text-chart-5",
  Customization: "bg-muted/20 text-muted-foreground",
}

export function FeatureGrid() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/5 to-background" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-balance mb-6 text-gradient">Complete Feature Suite</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-3xl mx-auto leading-relaxed">
            Everything you need to manage your metro fleet efficiently and effectively with cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card
                key={index}
                className="group gradient-card border-border/50 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
              >
                <CardHeader className="pb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl glow-effect">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${categoryColors[feature.category as keyof typeof categoryColors]} font-medium px-3 py-1`}
                    >
                      {feature.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300 font-semibold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <CardDescription className="text-base leading-relaxed text-card-foreground/70">
                    {feature.description}
                  </CardDescription>
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Key Benefits:</p>
                    <ul className="space-y-2">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-center gap-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
