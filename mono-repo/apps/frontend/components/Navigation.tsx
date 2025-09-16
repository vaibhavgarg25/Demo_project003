"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, Sun, Moon, Monitor } from "lucide-react"
import { toast } from "sonner"
import { useTheme } from "next-themes"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token")
      const email = localStorage.getItem("userEmail")
      const name = localStorage.getItem("userName")
      setIsLoggedIn(!!token)
      setUserEmail(email)
      setUserName(name)
    }

    checkLoginStatus()
    window.addEventListener("storage", checkLoginStatus)
    return () => window.removeEventListener("storage", checkLoginStatus)
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    setIsLoggedIn(false)
    setUserEmail(null)
    toast.success("Logged out successfully!")
    window.location.href = "/"
  }

  const navItems = [
    { href: "/", label: "HOME" },
    { href: "/features", label: "FEATURES" },
    { href: "/how-to-use", label: "HELP" },
    ...(isLoggedIn ? [{ href: "/dashboard", label: "DASHBOARD" }] : [{ href: "/login", label: "LOGIN" }]),
  ]

  const getThemeIcon = () => {
    if (!mounted) return <Monitor className="w-4 h-4" />

    switch (theme) {
      case "light":
        return <Sun className="w-4 h-4" />
      case "dark":
        return <Moon className="w-4 h-4" />
      default:
        return <Monitor className="w-4 h-4" />
    }
  }

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("system")
    } else {
      setTheme("light")
    }
  }

  const getThemeTitle = () => {
    if (!mounted) return "Current theme: system. Click to cycle."
    return `Current theme: ${theme || "system"}. Click to cycle.`
  }

  return (
    <nav className="fixed top-0 left-0 z-50 w-full ">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg tracking-widest text-foreground">
          KOCHI METRO RAIL
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-mono tracking-wider transition-colors 
                  ${isActive ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
              >
                [ {item.label} ]
              </Link>
            )
          })}

          <Button
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            className="text-foreground hover:text-primary hover:bg-muted transition-colors"
            title={getThemeTitle()}
          >
            {getThemeIcon()}
          </Button>

          {isLoggedIn && (
            <div className="flex items-center gap-4 ml-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2 bg-transparent"
              >
                <LogOut className="size-4" />
                SIGN OUT
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" className="text-foreground">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] flex flex-col justify-between">
            <div className="flex flex-col gap-6 mt-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-mono tracking-wider transition-colors 
                      ${isActive ? "text-primary font-semibold" : "text-foreground hover:text-primary"}`}
                  >
                    [ {item.label} ]
                  </Link>
                )
              })}

              <Button
                variant="ghost"
                onClick={cycleTheme}
                className="text-foreground hover:text-primary justify-start px-0"
              >
                {getThemeIcon()}
                <span className="ml-2 font-mono tracking-wider">[ THEME ]</span>
              </Button>
            </div>

            {isLoggedIn && (
              <div className="flex flex-col gap-3 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout()
                    setIsOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <LogOut className="size-4" />
                  SIGN OUT
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  )
}
