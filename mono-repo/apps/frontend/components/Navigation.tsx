"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut } from "lucide-react"
import { toast } from "sonner"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  const pathname = usePathname()

  useEffect(() => {
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
    ...(isLoggedIn
      ? [{ href: "/dashboard", label: "DASHBOARD" }]
      : [{ href: "/login", label: "LOGIN" }]),
  ]

  return (
    <nav className="fixed top-0 left-0 z-50 w-full bg-transparent text-white">
      <div className="flex h-16 items-center justify-between px-8">
        {/* Logo */}
        <Link
          href="/"
          className="font-bold text-lg tracking-widest text-white"
        >
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
                  ${isActive
                    ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(255,200,0,0.8)]"
                    : "text-white hover:text-yellow-400 hover:drop-shadow-[0_0_6px_rgba(255,200,0,0.8)]"
                  }`}
              >
                [ {item.label} ]
              </Link>
            )
          })}

          {isLoggedIn && (
            <div className="flex items-center gap-4 ml-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
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
            <Button variant="ghost" size="sm" className="text-white">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[280px] flex flex-col justify-between bg-black text-white"
          >
            <div className="flex flex-col gap-6 mt-8">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-base font-mono tracking-wider transition-colors 
                      ${isActive
                        ? "text-yellow-400 drop-shadow-[0_0_6px_rgba(255,200,0,0.8)]"
                        : "text-white hover:text-yellow-400 hover:drop-shadow-[0_0_6px_rgba(255,200,0,0.8)]"
                      }`}
                  >
                    [ {item.label} ]
                  </Link>
                )
              })}
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
