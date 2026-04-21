"use client";

import type { Era, EraDef } from "@/types";

type Props = {
  eras: EraDef[];
  currentEra: Era;
  onChange: (era: Era) => void;
};

export default function YearSlider({ eras, currentEra, onChange }: Props) {
  const currentIndex = eras.findIndex((e) => e.year === currentEra);
  const currentDef = eras[currentIndex];

  return (
    <div className="flex flex-col gap-2 px-5 py-3">
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

      {/* ステップラベル */}
      <div className="flex justify-between">
        {eras.map((era) => (
          <button
            key={era.year}
            onClick={() => onChange(era.year)}
            className={`text-[10px] tabular-nums transition-colors ${
              era.year === currentEra
                ? "font-bold text-white"
                : "text-white/40"
            }`}
          >
            {era.year}
          </button>
        ))}
      </div>

      {/* 一行説明 */}
      <p className="text-[11px] leading-tight text-white/60">
        {currentDef.description}
      </p>
    </div>
  );
}
