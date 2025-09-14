"use client"

import { useEffect, useState } from "react"

interface ClockProps {
  showWatermark?: boolean
}

export function Clock({ showWatermark = false }: ClockProps) {
  const [time, setTime] = useState<string>("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => {
      const now = new Date()
      const timeString = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      setTime(timeString)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="font-mono text-sm text-muted">--:--:--</div>
  }

  return (
    <>
      <time className="font-mono text-sm text-text" dateTime={time}>
        {time}
      </time>
      {showWatermark && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="text-9xl font-mono text-muted opacity-5 select-none">{time}</div>
        </div>
      )}
    </>
  )
}
