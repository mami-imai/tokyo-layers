"use client";

import type { Era, EraDef } from "@/types";

/** 年代→地図タイルの出典ラベル */
const TILE_LABELS: Record<number, string> = {
  1000: "色別標高図（国土地理院）",
  1456: "色別標高図（国土地理院）",
  1603: "治水地形分類図（国土地理院）",
  1900: "陸軍撮影航空写真 (1936-42)",
  1955: "米軍撮影航空写真 (1945-50)",
  1985: "旧版航空写真 (1961-69)",
  2025: "現在の地図",
};

type Props = {
  eras: EraDef[];
  currentEra: Era;
  onChange: (era: Era) => void;
};

export default function YearSlider({ eras, currentEra, onChange }: Props) {
  const currentIndex = eras.findIndex((e) => e.year === currentEra);
  const currentDef = eras[currentIndex];

  return (
    <div className="flex flex-col gap-1.5 px-4 py-3">
      {/* 年代ラベル + 説明 */}
      <div className="flex items-baseline justify-between">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: currentDef.color }}
        >
          {currentDef.year}
        </span>
        <span className="text-xs text-white/50">{currentDef.label}</span>
      </div>

      {/* スライダー本体 */}
      <input
        type="range"
        min={0}
        max={eras.length - 1}
        step={1}
        value={currentIndex}
        onChange={(e) => onChange(eras[Number(e.target.value)].year)}
        className="year-slider w-full"
      />

      {/* ステップラベル: 7個あるのでコンパクトに */}
      <div className="flex justify-between">
        {eras.map((era) => (
          <button
            key={era.year}
            onClick={() => onChange(era.year)}
            className={`min-w-0 text-[9px] tabular-nums transition-colors ${
              era.year === currentEra
                ? "font-bold text-white"
                : "text-white/35"
            }`}
          >
            {era.year}
          </button>
        ))}
      </div>

      {/* 一行説明 + 地図出典 */}
      <p className="text-[11px] leading-tight text-white/60">
        {currentDef.description}
      </p>
      <p className="text-[9px] text-white/30">
        {TILE_LABELS[currentEra] ?? "地形図"}
      </p>
    </div>
  );
}
