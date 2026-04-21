"use client";

import { useState, useCallback } from "react";
import MapView from "@/components/MapView";
import YearSlider from "@/components/YearSlider";
import Legend from "@/components/Legend";
import BottomSheet from "@/components/BottomSheet";
import DetailPanel from "@/components/DetailPanel";
import { getMeta, getEras, getPoints, getTerrains, getStory } from "@/lib/data-loader";
import type { Era, PointProperties, PointStory } from "@/types";

const meta = getMeta();
const eras = getEras();
const points = getPoints();
const terrains = getTerrains();

type SelectedPoint = {
  id: string;
  name: string;
  category: string;
  story: PointStory;
};

export default function Home() {
  const [currentEra, setCurrentEra] = useState<Era>(2025);
  const [selected, setSelected] = useState<SelectedPoint | null>(null);

  const handlePointTap = useCallback((pointId: string) => {
    // points から name / category を引く
    const feature = points.features.find(
      (f) => f.properties.id === pointId
    );
    if (!feature) return;

    const props = feature.properties as PointProperties;
    const story = getStory(pointId);

    setSelected({
      id: pointId,
      name: props.name,
      category: props.category,
      story: story ?? {},
    });
  }, []);

  const handleClose = useCallback(() => setSelected(null), []);

  return (
    <div className="relative h-full w-full">
      {/* 地図: 全画面 */}
      <MapView
        center={meta.center}
        zoom={meta.zoom}
        points={points}
        terrains={terrains}
        eras={eras}
        currentEra={currentEra}
        onPointTap={handlePointTap}
      />

      {/* タイトルオーバーレイ: 左上 */}
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 bg-gradient-to-b from-black/60 to-transparent px-4 pt-[env(safe-area-inset-top)] pb-8">
        <div className="pt-3">
          <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-lg">
            都市の地層
          </h1>
          <p className="text-[10px] text-white/50">Tokyo Layers</p>
        </div>
      </div>

      {/* 凡例: 右上 */}
      <div className="absolute top-4 right-3 z-10">
        <Legend currentEra={currentEra} />
      </div>

      {/* 年代スライダー: 下部固定 */}
      <div className="absolute right-0 bottom-0 left-0 z-10 bg-gradient-to-t from-black/80 via-black/60 to-transparent pb-[env(safe-area-inset-bottom)]">
        <YearSlider
          eras={eras}
          currentEra={currentEra}
          onChange={setCurrentEra}
        />
      </div>

      {/* 詳細パネル: ボトムシート */}
      <BottomSheet open={selected !== null} onClose={handleClose}>
        {selected && (
          <DetailPanel
            pointName={selected.name}
            category={selected.category}
            story={selected.story}
            eras={eras}
            currentEra={currentEra}
          />
        )}
      </BottomSheet>
    </div>
  );
}
