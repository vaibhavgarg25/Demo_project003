import { Navigation } from "@/components/navigation"
import { HelpHero } from "@/components/help-hero"
import { QuickStart } from "@/components/quick-start"
import { HelpFAQ } from "@/components/help-faq"
import { HelpTutorials } from "@/components/help-tutorials"
import { HelpSupport } from "@/components/help-support"

export default function HelpPage() {
  return (
    <main className="min-h-screen gradient-bg">
      <Navigation />
      <HelpHero />
      <QuickStart />
      <HelpTutorials />
      <HelpFAQ />
      <HelpSupport />
    </main>
  )
}
