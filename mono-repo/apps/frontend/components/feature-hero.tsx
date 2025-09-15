import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, Sparkles } from "lucide-react"

export function FeatureHero() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 gradient-bg overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.55_0.18_200_/_0.05),transparent_70%)]" />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <div className="inline-flex items-center gap-2 gradient-card text-accent px-6 py-3 rounded-full text-sm font-medium mb-8 glow-effect">
          <Sparkles className="h-4 w-4" />
          Advanced Fleet Management
          <Zap className="h-4 w-4" />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance mb-8 leading-tight">
          Powerful Features for
          <span className="text-gradient block mt-2">Modern Transit</span>
        </h1>

        <p className="text-xl text-card-foreground/80 text-pretty mb-12 max-w-2xl mx-auto leading-relaxed">
          Discover comprehensive tools designed to streamline your metro operations, enhance safety protocols, and
          optimize fleet performance with real-time insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button size="lg" className="text-lg px-10 py-4 glow-effect hover:scale-105 transition-all duration-300">
            Explore All Features
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-10 py-4 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 bg-transparent"
          >
            Watch Demo
          </Button>
        </div>
      </div>
    </section>
  )
}
