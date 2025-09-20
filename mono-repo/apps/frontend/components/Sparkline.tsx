// components/Sparkline.tsx
import React from "react";

export const Sparkline: React.FC<{ data: number[]; className?: string }> = ({ data, className }) => {
  if (!data || data.length === 0) return null;
  const w = 120;
  const h = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const norm = (v: number) => (max === min ? h / 2 : ((v - min) / (max - min)) * (h - 4) + 2);
  const points = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - norm(d)}`).join(" ");
  return (
    <svg className={className} width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <polyline points={points} stroke="rgba(8,166,160,0.9)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx={w} cy={h - norm(data[data.length - 1])} r={3} fill="rgba(8,166,160,0.95)" />
    </svg>
  );
};
