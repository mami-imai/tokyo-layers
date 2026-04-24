"use client";

import type { Era } from "@/types";

/** 地形ポリゴンの凡例定義 */
const TERRAIN_LEGEND: {
  type: string;
  label: string;
  color: string;
  maxEra?: number;
  minEra?: number;
}[] = [
  { type: "water", label: "海・入江", color: "#1a6fa0" },
  { type: "marsh", label: "低湿地", color: "#4a7c59", maxEra: 1456 },
  { type: "floodplain", label: "氾濫原", color: "#6b9daa", maxEra: 1603 },
  { type: "waterway", label: "水路・運河", color: "#2d8fc4", minEra: 1603, maxEra: 1955 },
  { type: "district", label: "歴史的街区", color: "#c4713b", minEra: 1900, maxEra: 1955 },
  { type: "redevelopment", label: "再開発", color: "#a8e6cf", minEra: 1985 },
];

type Props = {
  currentEra: Era;
};

export default function Legend({ currentEra }: Props) {
  const visible = TERRAIN_LEGEND.filter((item) => {
    const min = item.minEra ?? 0;
    const max = item.maxEra ?? 9999;
    return currentEra >= min && currentEra <= max;
  });

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-black/60 px-2.5 py-2 backdrop-blur-sm">
      {visible.map((item) => (
        <div key={item.type} className="flex items-center gap-2">
          <div
            className="h-2.5 w-4 rounded-sm"
            style={{ backgroundColor: item.color, opacity: 0.7 }}
          />
          <span className="text-[10px] text-white/70">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
