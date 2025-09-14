"use client"

import { Clock } from "./Clock"
import { ThemeToggle } from "./ThemeToggle"
import { usePathname } from "next/navigation"
import { logout, getCurrentUser } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LogOut, User } from "lucide-react"

const pageNames: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/trainsets": "Trainsets",
  "/dashboard/planner": "Planner",
  "/dashboard/simulation": "Simulation",
  "/dashboard/history": "History",
  "/dashboard/settings": "Settings",
}

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const pageName = pageNames[pathname] || "Dashboard"
  const user = getCurrentUser()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <header className="h-16 border-b border-border bg-surface px-6 flex items-center justify-between">
      <h1 className="text-lg font-medium text-text text-balance">{pageName}</h1>

      <div className="flex items-center gap-4">
        <Clock />

        {user && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <User className="w-4 h-4" />
            <span>{user.name}</span>
          </div>
        )}

        <ThemeToggle />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted hover:text-text hover:bg-hover rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </header>
  )
}
