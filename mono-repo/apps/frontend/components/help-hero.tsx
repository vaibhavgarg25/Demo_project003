import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, BookOpen, Video, MessageCircle, Sparkles } from "lucide-react"

export function HelpHero() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 gradient-bg overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.65_0.22_160_/_0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,oklch(0.55_0.18_200_/_0.06),transparent_60%)]" />

      <div className="container mx-auto max-w-4xl text-center relative z-10">
        <div className="inline-flex items-center gap-3 gradient-card text-accent px-6 py-3 rounded-full text-sm font-medium mb-8 glow-effect">
          <BookOpen className="h-4 w-4" />
          Help Center
          <Sparkles className="h-4 w-4" />
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance mb-8 leading-tight">
          How can we
          <span className="text-gradient block mt-2">help you today?</span>
        </h1>

        <p className="text-xl text-card-foreground/80 text-pretty mb-12 max-w-3xl mx-auto leading-relaxed">
          Find answers, learn how to use our platform, and get the most out of your fleet management system with our
          comprehensive guides and tutorials.
        </p>

        <div className="relative max-w-lg mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            className="pl-12 pr-6 py-4 text-lg gradient-card border-border/50 focus:border-primary/50 glow-effect"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4 gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 bg-transparent"
          >
            <Video className="mr-2 h-5 w-5" />
            Watch Tutorials
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="text-lg px-8 py-4 gradient-card border-border/50 hover:border-secondary/50 transition-all duration-300 hover:scale-105 bg-transparent"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Support
          </Button>
        </div>
      </div>
    </section>
  )
}
