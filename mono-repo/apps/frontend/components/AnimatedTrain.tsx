"use client"

import { useEffect, useState } from "react"

export function AnimatedTrain() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return (
    <div
      className="flex items-center justify-center p-8"
      role="img"
      aria-label="Animated Kochi Metro train illustration"
    >
      <div className={`text-text ${!reducedMotion ? "animate-train" : ""}`}>
        <svg
          width="200"
          height="80"
          viewBox="0 0 200 80"
          className="w-full max-w-sm"
          role="presentation"
          focusable="false"
          aria-hidden="true"
        >
          {/* Train body */}
          <g id="train-body">
            {/* Main body */}
            <rect x="20" y="20" width="160" height="30" rx="15" fill="currentColor" opacity="0.9" />

            {/* Windows */}
            <rect x="30" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="50" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="70" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="110" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="130" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="150" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />

            {/* Front */}
            <path d="M20 35 L10 45 L20 50 Z" fill="currentColor" opacity="0.9" />

            {/* Back */}
            <rect x="180" y="30" width="10" height="20" rx="5" fill="currentColor" opacity="0.9" />

            {/* Door */}
            <rect x="90" y="25" width="15" height="20" rx="2" fill="currentColor" opacity="0.7" />
            <line x1="97" y1="30" x2="97" y2="40" stroke="white" strokeWidth="1" opacity="0.6" />

            {/* Metro logo placeholder */}
            <circle cx="35" cy="40" r="3" fill="white" opacity="0.9" />
            <text x="35" y="42" textAnchor="middle" fontSize="2" fill="currentColor" opacity="0.8">
              KM
            </text>
          </g>

          {/* Wheels */}
          <g id="train-wheels">
            <circle
              id="wheel-1"
              cx="40"
              cy="55"
              r="8"
              fill="currentColor"
              opacity="0.8"
              className={!reducedMotion ? "animate-wheel" : ""}
            />
            <circle cx="40" cy="55" r="4" fill="white" opacity="0.9" />

            <circle
              id="wheel-2"
              cx="80"
              cy="55"
              r="8"
              fill="currentColor"
              opacity="0.8"
              className={!reducedMotion ? "animate-wheel" : ""}
            />
            <circle cx="80" cy="55" r="4" fill="white" opacity="0.9" />

            <circle
              id="wheel-3"
              cx="120"
              cy="55"
              r="8"
              fill="currentColor"
              opacity="0.8"
              className={!reducedMotion ? "animate-wheel" : ""}
            />
            <circle cx="120" cy="55" r="4" fill="white" opacity="0.9" />

            <circle
              id="wheel-4"
              cx="160"
              cy="55"
              r="8"
              fill="currentColor"
              opacity="0.8"
              className={!reducedMotion ? "animate-wheel" : ""}
            />
            <circle cx="160" cy="55" r="4" fill="white" opacity="0.9" />
          </g>

          {/* Shadow */}
          <ellipse
            id="train-shadow"
            cx="100"
            cy="70"
            rx="90"
            ry="5"
            fill="currentColor"
            opacity="0.1"
            className={!reducedMotion ? "animate-shadow" : ""}
          />
        </svg>
      </div>

      <noscript>
        <div className="text-text" role="img" aria-label="Static Kochi Metro train illustration">
          <svg width="200" height="80" viewBox="0 0 200 80" className="w-full max-w-sm" role="presentation">
            <rect x="20" y="20" width="160" height="30" rx="15" fill="currentColor" opacity="0.9" />
            <rect x="30" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="50" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <rect x="70" y="25" width="12" height="8" rx="2" fill="white" opacity="0.8" />
            <circle cx="40" cy="55" r="8" fill="currentColor" opacity="0.8" />
            <circle cx="80" cy="55" r="8" fill="currentColor" opacity="0.8" />
            <circle cx="120" cy="55" r="8" fill="currentColor" opacity="0.8" />
            <circle cx="160" cy="55" r="8" fill="currentColor" opacity="0.8" />
          </svg>
        </div>
      </noscript>
    </div>
  )
}
