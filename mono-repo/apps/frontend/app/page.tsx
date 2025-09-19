"use client"

import Link from "next/link"
import { ArrowRight, Train, Activity, Users, BarChart3 } from "lucide-react"
import LightRays from "@/components/background/LightRays"
import { Navigation } from "@/components/Navigation"
import SplitText from "../components/SplitText"

const handleAnimationComplete = () => {
  console.log("All letters have animated!")
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 pointer-events-none">
        <LightRays
          raysOrigin="top-center"
          raysColor="#008080"
          raysSpeed={1.2}
          lightSpread={0.9}
          rayLength={1.8}
          followMouse={true}
          mouseInfluence={0.08}
          noiseAmount={0.03}
          distortion={0.02}
          fadeDistance={0.7}
          saturation={0.8}
        />
      </div>

      <Navigation />

      <main className="relative z-10">
        <section className="min-h-screen flex items-center px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              {/* Left: Content */}
              <div className="space-y-16">
                <div className="space-y-10">
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.85]">
                    <SplitText
                      text="KOCHI METRO"
                      className="bg-gradient-to-r from-teal-400 to-white bg-clip-text text-transparent inline-block"
                      delay={100}
                      duration={0.6}
                      ease="power3.out"
                      splitType="chars"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      threshold={0.1}
                      rootMargin="-100px"
                      textAlign="center"
                      onLetterAnimationComplete={handleAnimationComplete}
                    />
                  </h1>

                  <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground leading-relaxed max-w-2xl text-pretty font-light">
                    Advanced fleet management system for modern urban transit. Monitor, control, and optimize your metro
                    operations with precision.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                  <Link
                    href="/dashboard"
                    className="cta-primary inline-flex items-center justify-center gap-3 px-10 py-5 rounded-xl text-lg font-semibold transition-all duration-300 group"
                  >
                    Access Dashboard
                    <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>

              {/* Right: Train Illustration */}
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative">
                  <div className="spotlight-glow absolute inset-0 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 rounded-full opacity-60"></div>

                  <div className="train-glow relative z-10 animate-float">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-teal-400/20 to-blue-400/20 rounded-2xl blur-xl scale-110 group-hover:scale-125 transition-transform duration-700"></div>

                      <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-teal-500/20 group-hover:border-teal-400/40 transition-all duration-500">
                        <img
                          src="/assets/train.png"
                          alt="Modern Metro Train"
                          className="w-full max-w-lg h-auto drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            if (!target.src.includes("placeholder.svg")) {
                              target.src = "/placeholder.svg?height=400&width=600"
                            }
                          }}
                        />

                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-teal-400 rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-400 rounded-full animate-pulse delay-300"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-muted/40 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-teal/5 to-transparent"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">Why Choose Our Platform?</h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
                Comprehensive fleet management with real-time monitoring and intelligent automation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="feature-card glass-card p-10 rounded-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Train className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">Fleet Operations</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Monitor trains in real time with comprehensive tracking and control systems.
                </p>
              </div>

              <div className="feature-card glass-card p-10 rounded-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Activity className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">Predictive Maintenance</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Reduce downtime with smart alerts and predictive maintenance scheduling.
                </p>
              </div>

              <div className="feature-card glass-card p-10 rounded-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">Staff Scheduling</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Assign cleaning and inspection teams seamlessly with automated workflows.
                </p>
              </div>

              <div className="feature-card glass-card p-10 rounded-2xl group">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-teal/20 to-brand-teal/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="w-8 h-8 text-brand-teal" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-balance">Smart Analytics</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Track performance, efficiency, and compliance with advanced analytics.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
