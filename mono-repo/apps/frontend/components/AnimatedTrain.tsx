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
      style={{ color: "var(--foreground)" }} // sets currentColor inside SVG for light mode; theme will override
    >
      {/* Inline styles so this component is self-contained */}
      <style>{`
        /* container classes */
        .train-wrap { display: inline-block; width: 100%; max-width: 360px; }
        .train-scene { width: 100%; height: auto; display: block; }

        /* motion - respects reduced motion via media query */
        @keyframes train-bob {
          0% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-6px) translateX(2px); }
          100% { transform: translateY(0) translateX(0); }
        }
        @keyframes wheel-rotate {
          to { transform: rotate(360deg); }
        }
        @keyframes shadow-scale {
          0% { transform: scaleX(0.98) scaleY(1); opacity: 0.08; }
          50% { transform: scaleX(1.02) scaleY(1.05); opacity: 0.12; }
          100% { transform: scaleX(0.98) scaleY(1); opacity: 0.08; }
        }

        .animate-train { animation: train-bob 3.2s ease-in-out infinite; will-change: transform; }
        .animate-wheel { 
          animation: wheel-rotate 0.8s linear infinite;
          transform-box: fill-box;
          transform-origin: center;
          will-change: transform;
        }
        .animate-shadow { animation: shadow-scale 3.2s ease-in-out infinite; transform-origin: center; will-change: transform, opacity; }

        /* Visual tuning: use CSS variables for stroke/fill where possible */
        .train-window { fill: white; opacity: 0.92; stroke: rgba(0,0,0,0.06); stroke-width: 0.6; }
        .train-door { fill: currentColor; opacity: 0.12; }
        .train-accent { fill: var(--accent); }
        .train-accent-dark { fill: var(--primary); }
        .train-body-stroke { stroke: rgba(0,0,0,0.06); stroke-width: 0.6; }

        /* Respect prefers-reduced-motion at CSS level too */
        @media (prefers-reduced-motion: reduce) {
          .animate-train, .animate-wheel, .animate-shadow { animation: none !important; }
        }

        /* Make sure the tiny text for KM in svg remains legible */
        .metro-label { font-family: "Chirp", -apple-system, "Segoe UI", Roboto, sans-serif; font-size: 8px; font-weight: 700; fill: white; opacity: 0.95; }
      `}</style>

      <div className={`train-wrap ${!reducedMotion ? "animate-train" : ""}`}>
        <svg
          className="train-scene"
          viewBox="0 0 360 140"
          role="presentation"
          focusable="false"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* defs for gradients */}
          <defs>
            <linearGradient id="bodyGrad" x1="0" x2="1" y1="0" y2="0">
              {/* uses tokens so theme switches colors */}
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
            </linearGradient>

            <linearGradient id="windowGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.85)" />
            </linearGradient>

            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.18" />
            </filter>
          </defs>

          {/* ground shadow */}
          <g id="shadow" transform="translate(0,78)">
            <ellipse
              cx="180"
              cy="28"
              rx="130"
              ry="18"
              fill="var(--foreground)"
              opacity="0.08"
              className={!reducedMotion ? "animate-shadow" : ""}
            />
          </g>

          {/* train group */}
          <g id="train" transform="translate(0,12)">
            {/* main body with soft stroke and gradient */}
            <rect
              x="20"
              y="20"
              rx="18"
              ry="18"
              width="320"
              height="56"
              fill="url(#bodyGrad)"
              className="train-body-stroke"
              stroke="rgba(0,0,0,0.06)"
              filter="url(#softShadow)"
            />

            {/* side detailing stripe */}
            <rect x="28" y="44" width="304" height="6" rx="3" fill="rgba(255,255,255,0.12)" />

            {/* windows (even spacing) */}
            {[
              { x: 46, w: 28 },
              { x: 86, w: 28 },
              { x: 126, w: 28 },
              { x: 186, w: 28 },
              { x: 226, w: 28 },
              { x: 266, w: 28 },
            ].map((win, i) => (
              <g key={`w-${i}`}>
                <rect
                  x={win.x}
                  y="30"
                  width={win.w}
                  height="22"
                  rx="4"
                  ry="4"
                  className="train-window"
                  fill="url(#windowGrad)"
                />
                <rect
                  x={win.x + 3}
                  y="33"
                  width={win.w - 6}
                  height="16"
                  rx="3"
                  ry="3"
                  fill="rgba(255,255,255,0.14)"
                />
              </g>
            ))}

            {/* door */}
            <rect x="154" y="28" width="38" height="30" rx="4" className="train-door" />

            {/* front nose */}
            <path d="M20 56 L12 70 L20 76 L20 56 Z" fill="url(#bodyGrad)" />

            {/* back stub */}
            <rect x="320" y="34" width="10" height="28" rx="6" fill="url(#bodyGrad)" />

            {/* small logo circle */}
            <g transform="translate(40,46)">
              <circle r="8" fill="white" opacity="0.95" />
              <text className="metro-label" x="0" y="3" textAnchor="middle">
                KM
              </text>
            </g>

            {/* wheels group - each wheel is a rotated group so rotation animates nicely */}
            <g id="wheels" transform="translate(0,90)">
              {[44, 104, 164, 224].map((cx, idx) => (
                <g key={`wheel-${idx}`} transform={`translate(${cx},0)`}>
                  <g className={!reducedMotion ? "animate-wheel" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
                    <circle cx="0" cy="0" r="16" fill="var(--foreground)" opacity="0.9" />
                    <circle cx="0" cy="0" r="7" fill="white" />
                    {/* wheel spokes */}
                    <g stroke="rgba(255,255,255,0.08)" strokeWidth="1.6">
                      <line x1="-6" y1="-6" x2="6" y2="6" />
                      <line x1="-6" y1="6" x2="6" y2="-6" />
                    </g>
                  </g>
                </g>
              ))}
            </g>

            {/* subtle roof highlights */}
            <path d="M30 24 H330" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          </g>
        </svg>
      </div>
    </div>
  )
}
