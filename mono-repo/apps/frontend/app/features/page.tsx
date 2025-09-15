import { Navigation } from "@/components/navigation"
import { FeatureHero } from "@/components/feature-hero"
import { FeatureGrid } from "@/components/feature-grid"
import { FeatureComparison } from "@/components/feature-comparison"
import { FeatureCTA } from "@/components/feature-cta"

export default function FeaturesPage() {
  return (
    <main className="min-h-screen gradient-bg">
      <Navigation />
      <FeatureHero />
      <FeatureGrid />
      <FeatureComparison />
      <FeatureCTA />
    </main>
  )
}
