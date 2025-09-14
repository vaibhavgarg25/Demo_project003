"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { LayoutDashboard, Train, Calendar, BarChart3, History, Settings, Menu, X, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trainsets", href: "/dashboard/trainsets", icon: Train },
  { name: "Planner", href: "/dashboard/planner", icon: Calendar },
  { name: "Simulation", href: "/dashboard/simulation", icon: BarChart3 },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setCollapsed(true)} />}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-surface border-r border-border transition-all duration-300 lg:relative lg:z-auto",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <Train className="w-6 h-6 text-text" />
              <span className="font-medium text-text">Kochi Metro</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-md hover:bg-hover transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu className="w-4 h-4 text-text" /> : <X className="w-4 h-4 text-text" />}
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-text focus:ring-offset-2",
                  isActive ? "bg-hover text-text" : "text-muted hover:text-text hover:bg-hover",
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Profile section */}
        <div className="border-t border-border p-4">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center">
              <User className="w-4 h-4 text-muted" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">Fleet Manager</p>
                <p className="text-xs text-muted truncate">Operations Team</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
