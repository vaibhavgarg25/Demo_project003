import { Button } from "@/components/ui/button"
import { ArrowRight, Train } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 lg:py-32">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="metro-lines" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10h20M10 0v20" stroke="currentColor" strokeWidth="0.5" fill="none" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#metro-lines)" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-8 flex justify-center">
            <div className="flex items-center gap-3 rounded-full bg-primary/10 px-6 py-3">
              <Train className="h-6 w-6 text-primary" />
              <span className="font-semibold text-primary">Kochi Metro</span>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Smarter Fleet Induction, <span className="text-primary">Every Night</span>
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-lg text-muted-foreground text-pretty sm:text-xl lg:text-2xl">
            Turn a nightly scramble into a data-driven, auditable process for Kochi Metro's growing fleet.
          </p>

          {/* CTA Button */}
          <Button size="lg" className="group">
            See How It Works
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          {/* Hero Illustration */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="h-64 w-96 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 p-8 shadow-2xl">
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <Train className="mx-auto mb-4 h-16 w-16 text-primary" />
                    <div className="space-y-2">
                      <div className="h-2 w-24 rounded bg-primary/30"></div>
                      <div className="h-2 w-16 rounded bg-secondary/30"></div>
                      <div className="h-2 w-20 rounded bg-primary/20"></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating elements */}
              <div className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-secondary animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 h-6 w-6 rounded-full bg-primary animate-pulse delay-1000"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
