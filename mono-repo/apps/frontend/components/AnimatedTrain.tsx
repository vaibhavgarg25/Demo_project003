"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * SmoothBWTrainV3
 *
 * - rAF-driven wheel/rod animation for smoothness & synchronization
 * - CSS-driven bob + shadow for cheap, smooth overall motion
 * - Respects prefers-reduced-motion and visibilitychange
 */
type SmoothBWTrainV3Props = {
  animate?: boolean;
  speed?: number; // 1 = normal, >1 faster
  className?: string;
  ariaLabel?: string;
};

export function SmoothBWTrain({
  animate = true,
  speed = 1,
  className = "",
  ariaLabel = "Black and white steam locomotive",
}: SmoothBWTrainV3Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const [reduced, setReduced] = useState<boolean>(() =>
    typeof window !== "undefined" ? !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches : false
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(animate && !reduced);

  // clamp speed
  const safeSpeed = Math.max(0.25, Math.min(speed, 4));

  // Listen for prefers-reduced-motion changes
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setReduced(Boolean((e as any).matches));
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", handler as any);
    else mq.addListener(handler as any);
    setReduced(Boolean(mq.matches));
    return () => {
      if (typeof mq.removeEventListener === "function") mq.removeEventListener("change", handler as any);
      else mq.removeListener(handler as any);
    };
  }, []);

  // Pause when tab hidden
  useEffect(() => {
    function onVis() {
      if (document.hidden) {
        setIsPlaying(false);
      } else {
        setIsPlaying(animate && !reduced);
      }
    }
    document.addEventListener("visibilitychange", onVis, false);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [animate, reduced]);

  // reflect animate/reduced
  useEffect(() => {
    setIsPlaying(animate && !reduced);
  }, [animate, reduced]);

  // rAF loop driving wheel & rod transforms
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // select wheel groups and rod groups by data attributes
    const wheelNodes = Array.from(svg.querySelectorAll<SVGGElement>("[data-wheel]"));
    const rodNodes = Array.from(svg.querySelectorAll<SVGGElement>("[data-rod]"));

    // If reduced motion is requested, ensure no rAF runs and set static transforms
    if (reduced || !isPlaying) {
      // optionally reset transforms
      wheelNodes.forEach((w) => {
        w.style.transform = "rotate(0deg)";
        // ensure transform-origin set
        w.style.transformOrigin = "center";
        // ask browser to use GPU composite
        w.style.willChange = "transform";
      });
      rodNodes.forEach((r) => {
        r.style.transform = "rotate(0deg)";
        r.style.transformOrigin = "center";
        r.style.willChange = "transform";
      });
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const baseWheelDuration = 1000 * 0.9; // ms for one full rotation at speed=1 (0.9s)
    const period = baseWheelDuration / safeSpeed;

    // Each rod will have a small phase offset so they don't all line up perfectly
    const rodPhaseOffsets = rodNodes.map((_, i) => (i * 0.18 * Math.PI)); // radians

    const onFrame = (t: number) => {
      if (lastTimeRef.current == null) lastTimeRef.current = t;
      const elapsed = t; // use absolute time base for smoothness

      // angle in degrees: 360 * (elapsed / period) % 360
      const angle = ((elapsed % period) / period) * 360; // degrees

      // apply smooth rotation to wheels, with subtle per-wheel speed tweaks for realism
      wheelNodes.forEach((w, i) => {
        // small jitter/phase for realism
        const phaseDeg = i * 6; // degrees offset per wheel
        // Slight per-wheel speed offset (very small)
        const wheelAngle = angle * (1 + (i - 1) * 0.002) + phaseDeg;
        // set transform using rotate + translate3d hint
        w.style.transform = `rotate(${wheelAngle}deg) translate3d(0,0,0)`;
        w.style.transformOrigin = "center";
        w.style.willChange = "transform";
      });

      // rods oscillate / rotate with phase offset relative to wheel rotation
      rodNodes.forEach((r, i) => {
        // Convert phase offset to degrees
        const phaseDeg = (rodPhaseOffsets[i] * 180) / Math.PI;
        const rodAngle = angle + 90 + phaseDeg; // +90 to visually align rods better
        r.style.transform = `rotate(${rodAngle}deg) translate3d(0,0,0)`;
        r.style.transformOrigin = "center";
        r.style.willChange = "transform";
      });

      rafRef.current = requestAnimationFrame(onFrame);
    };

    rafRef.current = requestAnimationFrame(onFrame);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [isPlaying, reduced, safeSpeed, svgRef.current]);

  const toggle = () => {
    if (reduced) {
      setIsPlaying(false);
      return;
    }
    setIsPlaying((s) => !s);
  };

  // style var used by CSS for bob/shadow durations
  const wrapperStyle: React.CSSProperties = {
    ["--train-speed" as any]: String(safeSpeed),
  };

  return (
    <div className={`smooth-bw-train-v3-root ${className}`} style={wrapperStyle}>
      <style>{`
        .smooth-bw-train-v3-root { display:flex; flex-direction:column; align-items:center; gap:12px; padding:8px; }
        .sbt3-svg { width:100%; max-width:760px; height:auto; display:block; }
        .sbt3-svg * { shape-rendering: geometricPrecision; vector-effect: non-scaling-stroke; }

        /* CSS bob + shadow (cheap, smooth) */
        :root { --base-bob: 3.6s; --base-shadow: 3.6s; }
        .smooth-bw-train-v3-root { --train-speed: var(--train-speed, 1); }
        .sbt3-train-bob { will-change: transform; }
        .playing .sbt3-train-bob {
          animation: sbt3-bob calc(var(--base-bob) / var(--train-speed)) cubic-bezier(.22,.9,.32,1) infinite;
        }
        @keyframes sbt3-bob {
          0% { transform: translate3d(0,0,0); }
          50% { transform: translate3d(2px,-6px,0); }
          100% { transform: translate3d(0,0,0); }
        }

        .sbt3-shadow { will-change: transform, opacity; }
        .playing .sbt3-shadow {
          animation: sbt3-shadow calc(var(--base-shadow) / var(--train-speed)) ease-in-out infinite;
        }
        @keyframes sbt3-shadow {
          0% { transform: scaleX(0.985) scaleY(1); opacity:0.06; }
          50% { transform: scaleX(1.02) scaleY(1.04); opacity:0.14; }
          100% { transform: scaleX(0.985) scaleY(1); opacity:0.06; }
        }

        /* control styles */
        .sbt3-controls { display:flex; gap:10px; align-items:center; }
        .sbt3-btn {
          padding:8px 14px; border-radius:10px; background:#fff; color:#000; border:2px solid #000;
          font-weight:700; cursor:pointer;
        }
        .sbt3-btn[disabled] { opacity:.45; cursor:not-allowed; }

        @media (prefers-reduced-motion: reduce) {
          .playing .sbt3-train-bob,
          .playing .sbt3-shadow { animation: none !important; }
        }
      `}</style>

      <div className={`sbt3-wrap ${isPlaying && !reduced ? "playing" : "paused"}`} aria-label={ariaLabel} role="img">
        <svg
          ref={svgRef}
          className="sbt3-svg"
          viewBox="0 0 900 280"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <defs>
            <clipPath id="cabClip3"><rect x="682" y="26" width="196" height="152" rx="8" /></clipPath>
          </defs>

          {/* shadow (CSS animated) */}
          <ellipse className="sbt3-shadow" cx="450" cy="230" rx="320" ry="28" fill="#000" opacity="0.08" />

          {/* bobbing group (CSS animated) */}
          <g className="sbt3-train-bob">
            <rect x="40" y="120" width="760" height="44" rx="6" fill="#000" />
            <rect x="70" y="90" width="620" height="86" rx="14" fill="#fff" stroke="#000" strokeWidth="6" />
            <rect x="80" y="60" width="520" height="110" rx="50" fill="#000" stroke="#000" strokeWidth="6" />
            <rect x="115" y="110" width="450" height="8" rx="4" fill="#fff" />
            <rect x="115" y="92" width="300" height="8" rx="4" fill="#fff" opacity="0.95" />
            {/* chimney + domes */}
            <rect x="120" y="18" width="46" height="46" rx="8" fill="#000" stroke="#000" strokeWidth="4" />
            <rect x="110" y="6" width="66" height="14" rx="6" fill="#000" stroke="#000" strokeWidth="4" />
            <ellipse cx="300" cy="48" rx="42" ry="18" fill="#000" stroke="#000" strokeWidth="4" />
            <ellipse cx="420" cy="42" rx="36" ry="14" fill="#000" stroke="#000" strokeWidth="4" />
          </g>

          {/* coupling + cab */}
          <g>
            <rect x="600" y="114" width="92" height="12" rx="6" fill="#000" />
            <rect x="688" y="94" width="8" height="48" rx="4" fill="#000" />
            <g clipPath="url(#cabClip3)">
              <rect x="690" y="38" width="160" height="140" rx="10" fill="#fff" stroke="#000" strokeWidth="6" />
              <rect x="678" y="26" width="184" height="20" rx="8" fill="#000" />
              <rect x="716" y="64" width="40" height="36" rx="6" fill="#000" />
              <rect x="768" y="64" width="40" height="36" rx="6" fill="#000" />
              <path d="M 722 120 L 762 120 L 762 92 L 730 92 Q 724 104 722 120 Z" fill="#f6f6f6" stroke="#000" strokeWidth="3" />
              <rect x="724" y="112" width="36" height="54" rx="4" fill="#fff" stroke="#000" strokeWidth="3" />
              <rect x="764" y="122" width="6" height="36" rx="3" fill="#000" />
              <rect x="758" y="166" width="28" height="8" rx="3" fill="#000" />
            </g>
          </g>

          {/* wheel groups with data attributes used by rAF loop */}
          <g transform="translate(220,190)">
            <g data-wheel className="sbt3-wheel w-0" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="46" fill="#000" stroke="#000" strokeWidth="6" />
              <circle r="20" fill="#fff" />
              <g stroke="#000" strokeWidth="6" strokeLinecap="round">
                <line x1="-28" y1="-28" x2="28" y2="28" />
                <line x1="-28" y1="28" x2="28" y2="-28" />
              </g>
              <circle r="8" fill="#000" stroke="#fff" strokeWidth="3" />
            </g>
            {/* connecting rod: mark as data-rod so rAF rotates it */}
            <g data-rod style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <rect x="44" y="-8" width="200" height="16" rx="8" fill="#000" />
            </g>
          </g>

          <g transform="translate(360,190)">
            <g data-wheel className="sbt3-wheel w-1" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="46" fill="#000" stroke="#000" strokeWidth="6" />
              <circle r="20" fill="#fff" />
              <g stroke="#000" strokeWidth="6" strokeLinecap="round">
                <line x1="-28" y1="-28" x2="28" y2="28" />
                <line x1="-28" y1="28" x2="28" y2="-28" />
              </g>
              <circle r="8" fill="#000" stroke="#fff" strokeWidth="3" />
            </g>
          </g>

          <g transform="translate(500,190)">
            <g data-wheel className="sbt3-wheel w-2" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="46" fill="#000" stroke="#000" strokeWidth="6" />
              <circle r="20" fill="#fff" />
              <g stroke="#000" strokeWidth="6" strokeLinecap="round">
                <line x1="-28" y1="-28" x2="28" y2="28" />
                <line x1="-28" y1="28" x2="28" y2="-28" />
              </g>
              <circle r="8" fill="#000" stroke="#fff" strokeWidth="3" />
            </g>
          </g>

          <g transform="translate(640,190)">
            <g data-wheel className="sbt3-wheel w-3" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="30" fill="#000" stroke="#000" strokeWidth="5" />
              <circle r="12" fill="#fff" />
              <g stroke="#000" strokeWidth="5" strokeLinecap="round">
                <line x1="-18" y1="-18" x2="18" y2="18" />
                <line x1="-18" y1="18" x2="18" y2="-18" />
              </g>
            </g>
          </g>

          <g transform="translate(760,190)">
            <g data-wheel className="sbt3-wheel w-4" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle r="22" fill="#000" stroke="#000" strokeWidth="4" />
              <circle r="9" fill="#fff" />
            </g>
          </g>
        </svg>
      </div>

      <div className="sbt3-controls" aria-hidden={reduced}>
        <button
          className="sbt3-btn"
          onClick={toggle}
          aria-pressed={isPlaying}
          disabled={reduced}
          title={reduced ? "Animations disabled (prefers-reduced-motion)" : isPlaying ? "Pause" : "Play"}
        >
          {reduced ? "Reduced motion" : isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}
