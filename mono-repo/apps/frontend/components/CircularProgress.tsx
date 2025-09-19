// components/CircularProgress.tsx
"use client";

import React from "react";

interface CircularProgressProps {
  value: number; // 0..100
  size?: number; // px
  thickness?: number; // stroke width
  className?: string;
  showPercentSign?: boolean;
}

export default function CircularProgress({
  value,
  size = 64,
  thickness = 8,
  className = "",
  showPercentSign = true,
}: CircularProgressProps) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = thickness;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Colors are inline for reliable SVG rendering.
  // If you want to use CSS variables you can map them into stopColor via JS.
  const gradId = "cp-teal-grad";

  return (
    <div
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={false}
      role="img"
      aria-label={`Progress ${pct} percent`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id={gradId} x1="0%" x2="100%">
            <stop offset="0%" stopColor="#06b6a4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>

        <g transform={`translate(${size / 2}, ${size / 2})`}>
          {/* background ring */}
          <circle
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={stroke}
            strokeLinecap="round"
          />
          {/* progress ring */}
          <circle
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90)"
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </g>
      </svg>

      {/* Centered label */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ lineHeight: 1 }}
      >
        <span
          className="font-semibold"
          style={{
            // choose a visible color that works in light/dark; you can swap class names if you use design tokens
            color: "var(--text-on-glass, #0f172a)",
            fontSize: Math.max(12, Math.round(size * 0.26)),
          }}
        >
          {pct}
          {showPercentSign ? "%" : ""}
        </span>
      </div>
    </div>
  );
}
