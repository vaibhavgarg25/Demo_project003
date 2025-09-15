import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play, Clock, BookOpen } from "lucide-react"

const tutorials = [
  {
    title: "Fleet Dashboard Overview",
    description: "Learn how to navigate and customize your main dashboard for optimal fleet monitoring.",
    duration: "8 min",
    level: "Beginner",
    category: "Getting Started",
    thumbnail: "/dark-mode-dashboard.png",
  },
  {
    title: "Setting Up Real-Time Alerts",
    description: "Configure intelligent notifications for maintenance, safety incidents, and operational updates.",
    duration: "12 min",
    level: "Beginner",
    category: "Configuration",
    thumbnail: "/notification-settings-dark-interface.jpg",
  },
  {
    title: "Advanced Analytics & Reporting",
    description: "Create custom reports and leverage analytics to optimize your fleet performance.",
    duration: "15 min",
    level: "Intermediate",
    category: "Analytics",
    thumbnail: "/analytics-charts-dark-dashboard.jpg",
  },
  {
    title: "Predictive Maintenance Setup",
    description: "Implement AI-powered maintenance scheduling to prevent breakdowns and reduce costs.",
    duration: "18 min",
    level: "Advanced",
    category: "Maintenance",
    thumbnail: "/maintenance-schedule-interface.jpg",
  },
  {
    title: "Team Management & Permissions",
    description: "Add team members, assign roles, and configure access permissions for different user types.",
    duration: "10 min",
    level: "Intermediate",
    category: "Administration",
    thumbnail: "/user-management-interface-dark.jpg",
  },
  {
    title: "Mobile App Integration",
    description: "Connect and configure the mobile app for on-the-go fleet management capabilities.",
    duration: "6 min",
    level: "Beginner",
    category: "Mobile",
    thumbnail: "/mobile-app-dark-mode.png",
  },
]

const categories = ["All", "Getting Started", "Configuration", "Analytics", "Maintenance", "Administration", "Mobile"]

const levelColors = {
  Beginner: "bg-accent/10 text-accent",
  Intermediate: "bg-primary/10 text-primary",
  Advanced: "bg-destructive/10 text-destructive",
}

export function HelpTutorials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/20">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-balance mb-4">Video Tutorials</h2>
          <p className="text-xl text-muted-foreground text-pretty max-w-2xl mx-auto leading-relaxed">
            Step-by-step video guides to help you master every aspect of the platform
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map((category, index) => (
            <Button key={index} variant={index === 0 ? "default" : "outline"} size="sm" className="rounded-full">
              {category}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial, index) => (
            <Card key={index} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
              <div className="relative">
                <img
                  src={tutorial.thumbnail || "/placeholder.svg"}
                  alt={tutorial.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <Button size="lg" className="rounded-full w-16 h-16 p-0">
                    <Play className="h-6 w-6 ml-1" />
                  </Button>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/60 text-white">
                    <Clock className="h-3 w-3 mr-1" />
                    {tutorial.duration}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {tutorial.category}
                  </Badge>
                  <Badge className={`text-xs ${levelColors[tutorial.level as keyof typeof levelColors]}`}>
                    {tutorial.level}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {tutorial.title}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <CardDescription className="text-sm leading-relaxed line-clamp-3">
                  {tutorial.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" size="lg">
            <BookOpen className="mr-2 h-5 w-5" />
            View All Tutorials
          </Button>
        </div>
      </div>
    </section>
  )
}
