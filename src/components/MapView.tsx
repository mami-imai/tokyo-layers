"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Era, PointCollection, EraDef, TerrainCollection } from "@/types";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const SOURCE_POINTS = "tokyo-points";
const SOURCE_TERRAINS = "tokyo-terrains";
const LAYER_CIRCLE = "points-circle";
const LAYER_LABEL = "points-label";
// 地形レイヤー: 種別ごとに色・透明度を分ける
const LAYER_TERRAIN_WATER = "terrain-water";
const LAYER_TERRAIN_WATERWAY = "terrain-waterway";
const LAYER_TERRAIN_DISTRICT = "terrain-district";
const LAYER_TERRAIN_REDEV = "terrain-redevelopment";
const LAYER_TERRAIN_OUTLINE = "terrain-outline";

const TERRAIN_LAYERS = [
  LAYER_TERRAIN_WATER,
  LAYER_TERRAIN_WATERWAY,
  LAYER_TERRAIN_DISTRICT,
  LAYER_TERRAIN_REDEV,
  LAYER_TERRAIN_OUTLINE,
] as const;

type Props = {
  center: [number, number];
  zoom: number;
  points: PointCollection;
  terrains: TerrainCollection;
  eras: EraDef[];
  currentEra: Era;
  onPointTap?: (pointId: string) => void;
};

/**
 * 地形ポリゴンの表示フィルタを生成
 * minEra <= currentEra <= maxEra のポリゴンを表示
 */
function terrainFilter(era: Era, terrainType: string): maplibregl.FilterSpecification {
  return [
    "all",
    ["==", ["get", "type"], terrainType],
    // minEra が未設定(0) or currentEra >= minEra
    ["<=", ["coalesce", ["get", "minEra"], 0], era],
    // maxEra が未設定(9999) or currentEra <= maxEra
    [">=", ["coalesce", ["get", "maxEra"], 9999], era],
  ];
}

export default function MapView({
  center,
  zoom,
  points,
  terrains,
  eras,
  currentEra,
  onPointTap,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const readyRef = useRef(false);

  const eraColorMap = Object.fromEntries(eras.map((e) => [e.year, e.color]));

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom,
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: true,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    map.on("load", () => {
      // --- 地形ポリゴン（ポイントより下に描画）---
      map.addSource(SOURCE_TERRAINS, {
        type: "geojson",
        data: terrains,
      });

      // 水域（日比谷入江・築地沖）: 青系半透明
      map.addLayer({
        id: LAYER_TERRAIN_WATER,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: {
          "fill-color": "#1a6fa0",
          "fill-opacity": 0.45,
        },
        filter: terrainFilter(currentEra, "water"),
      });

      // 水路（日本橋川水路網）: 細い青
      map.addLayer({
        id: LAYER_TERRAIN_WATERWAY,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: {
          "fill-color": "#2d8fc4",
          "fill-opacity": 0.5,
        },
        filter: terrainFilter(currentEra, "waterway"),
      });

      // 歴史的街区（銀座煉瓦街）: 暖色系
      map.addLayer({
        id: LAYER_TERRAIN_DISTRICT,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: {
          "fill-color": "#c4713b",
          "fill-opacity": 0.3,
        },
        filter: terrainFilter(currentEra, "district"),
      });

      // 再開発エリア: 白系
      map.addLayer({
        id: LAYER_TERRAIN_REDEV,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: {
          "fill-color": "#a8e6cf",
          "fill-opacity": 0.2,
        },
        filter: terrainFilter(currentEra, "redevelopment"),
      });

      // 全ポリゴン共通のアウトライン
      map.addLayer({
        id: LAYER_TERRAIN_OUTLINE,
        type: "line",
        source: SOURCE_TERRAINS,
        paint: {
          "line-color": "rgba(255,255,255,0.3)",
          "line-width": 1,
          "line-dasharray": [3, 2],
        },
        filter: [
          "all",
          ["<=", ["coalesce", ["get", "minEra"], 0], currentEra],
          [">=", ["coalesce", ["get", "maxEra"], 9999], currentEra],
        ],
      });

      // --- ポイントレイヤー（ポリゴンの上に描画）---
      map.addSource(SOURCE_POINTS, {
        type: "geojson",
        data: points,
      });

      map.addLayer({
        id: LAYER_CIRCLE,
        type: "circle",
        source: SOURCE_POINTS,
        paint: {
          "circle-radius": 10,
          "circle-color": eraColorMap[currentEra] ?? "#ffffff",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.6)",
        },
        filter: ["in", ["literal", currentEra], ["get", "eras"]],
      });

      map.addLayer({
        id: LAYER_LABEL,
        type: "symbol",
        source: SOURCE_POINTS,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "rgba(255,255,255,0.8)",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1,
        },
        filter: ["in", ["literal", currentEra], ["get", "eras"]],
      });

      readyRef.current = true;
    });

    // ポイントタップ
    map.on("click", LAYER_CIRCLE, (e) => {
      const feature = e.features?.[0];
      if (feature && onPointTap) {
        const id = (feature.properties as { id: string }).id;
        onPointTap(id);
      }
    });

    map.on("mouseenter", LAYER_CIRCLE, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", LAYER_CIRCLE, () => {
      map.getCanvas().style.cursor = "";
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cleanup = initMap();
    return () => cleanup?.();
  }, [initMap]);

  // era 切替時: ポイントフィルタ + 地形フィルタを同時更新
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // ポイント
    const pointFilter: maplibregl.FilterSpecification = [
      "in",
      ["literal", currentEra],
      ["get", "eras"],
    ];
    map.setFilter(LAYER_CIRCLE, pointFilter);
    map.setFilter(LAYER_LABEL, pointFilter);
    map.setPaintProperty(
      LAYER_CIRCLE,
      "circle-color",
      eraColorMap[currentEra] ?? "#ffffff"
    );

    // 地形ポリゴン: 種別ごとにフィルタ更新
    map.setFilter(LAYER_TERRAIN_WATER, terrainFilter(currentEra, "water"));
    map.setFilter(LAYER_TERRAIN_WATERWAY, terrainFilter(currentEra, "waterway"));
    map.setFilter(LAYER_TERRAIN_DISTRICT, terrainFilter(currentEra, "district"));
    map.setFilter(LAYER_TERRAIN_REDEV, terrainFilter(currentEra, "redevelopment"));

    // アウトラインは全種別共通
    map.setFilter(LAYER_TERRAIN_OUTLINE, [
      "all",
      ["<=", ["coalesce", ["get", "minEra"], 0], currentEra],
      [">=", ["coalesce", ["get", "maxEra"], 9999], currentEra],
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEra]);

  return <div ref={containerRef} className="h-full w-full" />;
}
