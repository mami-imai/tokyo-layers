"use client";

import { useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import type { Era, PointCollection, EraDef, TerrainCollection } from "@/types";

// --- 年代別ベースタイル定義 ---
// 国土地理院タイル（無料・APIキー不要）
const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>';

/** ラスタータイルから MapLibre スタイル JSON を生成 */
function rasterStyle(
  tileUrl: string,
  ext: "png" | "jpg" = "png"
): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      "raster-base": {
        type: "raster",
        tiles: [`${tileUrl}/{z}/{x}/{y}.${ext}`],
        tileSize: 256,
        attribution: GSI_ATTRIBUTION,
        maxzoom: 18,
      },
    },
    layers: [
      {
        id: "raster-base-layer",
        type: "raster",
        source: "raster-base",
        paint: {},
      },
    ],
  };
}

/**
 * 年代 → ベーススタイル
 *
 * 1900: 明治期の低湿地帯（swale）— 海岸線・湿地が可視化された地形図
 *       + 陸軍撮影航空写真（ort_riku10, 1936-42）をオーバーレイ
 * 1955: 米軍撮影航空写真（ort_USA10, 1945-50）— 戦後直後の焼け野原
 * 1985: 旧版航空写真（ort_old10, 1961-69）— 高度成長期
 * 2025: CARTO Dark Matter（現代ベクタースタイル）
 */
type EraStyleDef = {
  style: string | maplibregl.StyleSpecification;
  label: string;
};

const ERA_STYLES: Record<Era, EraStyleDef> = {
  1900: {
    style: rasterStyle("https://cyberjapandata.gsi.go.jp/xyz/ort_riku10"),
    label: "陸軍撮影航空写真 (1936-42)",
  },
  1955: {
    style: rasterStyle("https://cyberjapandata.gsi.go.jp/xyz/ort_USA10"),
    label: "米軍撮影航空写真 (1945-50)",
  },
  1985: {
    style: rasterStyle("https://cyberjapandata.gsi.go.jp/xyz/ort_old10"),
    label: "旧版航空写真 (1961-69)",
  },
  2025: {
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    label: "現在",
  },
};

// --- レイヤーID ---
const SOURCE_POINTS = "tokyo-points";
const SOURCE_TERRAINS = "tokyo-terrains";
const LAYER_CIRCLE = "points-circle";
const LAYER_LABEL = "points-label";
const LAYER_TERRAIN_WATER = "terrain-water";
const LAYER_TERRAIN_WATERWAY = "terrain-waterway";
const LAYER_TERRAIN_DISTRICT = "terrain-district";
const LAYER_TERRAIN_REDEV = "terrain-redevelopment";
const LAYER_TERRAIN_OUTLINE = "terrain-outline";

type Props = {
  center: [number, number];
  zoom: number;
  points: PointCollection;
  terrains: TerrainCollection;
  eras: EraDef[];
  currentEra: Era;
  onPointTap?: (pointId: string) => void;
};

function terrainFilter(
  era: Era,
  terrainType: string
): maplibregl.FilterSpecification {
  return [
    "all",
    ["==", ["get", "type"], terrainType],
    ["<=", ["coalesce", ["get", "minEra"], 0], era],
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
  const currentStyleEraRef = useRef<Era | null>(null);
  // コールバックを ref に入れて initMap の依存を避ける
  const onPointTapRef = useRef(onPointTap);
  onPointTapRef.current = onPointTap;

  const eraColorMap = Object.fromEntries(eras.map((e) => [e.year, e.color]));

  /** GeoJSON ソース + レイヤーをまとめて追加 */
  const addOverlayLayers = useCallback(
    (map: maplibregl.Map, era: Era) => {
      // --- 地形ポリゴン ---
      map.addSource(SOURCE_TERRAINS, { type: "geojson", data: terrains });

      map.addLayer({
        id: LAYER_TERRAIN_WATER,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: { "fill-color": "#1a6fa0", "fill-opacity": 0.45 },
        filter: terrainFilter(era, "water"),
      });
      map.addLayer({
        id: LAYER_TERRAIN_WATERWAY,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: { "fill-color": "#2d8fc4", "fill-opacity": 0.5 },
        filter: terrainFilter(era, "waterway"),
      });
      map.addLayer({
        id: LAYER_TERRAIN_DISTRICT,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: { "fill-color": "#c4713b", "fill-opacity": 0.3 },
        filter: terrainFilter(era, "district"),
      });
      map.addLayer({
        id: LAYER_TERRAIN_REDEV,
        type: "fill",
        source: SOURCE_TERRAINS,
        paint: { "fill-color": "#a8e6cf", "fill-opacity": 0.2 },
        filter: terrainFilter(era, "redevelopment"),
      });
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
          ["<=", ["coalesce", ["get", "minEra"], 0], era],
          [">=", ["coalesce", ["get", "maxEra"], 9999], era],
        ],
      });

      // --- ポイント ---
      map.addSource(SOURCE_POINTS, { type: "geojson", data: points });

      map.addLayer({
        id: LAYER_CIRCLE,
        type: "circle",
        source: SOURCE_POINTS,
        paint: {
          "circle-radius": 10,
          "circle-color": eraColorMap[era] ?? "#ffffff",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(255,255,255,0.6)",
        },
        filter: ["in", ["literal", era], ["get", "eras"]],
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
        filter: ["in", ["literal", era], ["get", "eras"]],
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /** フィルタだけ更新（スタイル切替なしの場合） */
  const updateFilters = useCallback(
    (map: maplibregl.Map, era: Era) => {
      const pf: maplibregl.FilterSpecification = [
        "in",
        ["literal", era],
        ["get", "eras"],
      ];
      map.setFilter(LAYER_CIRCLE, pf);
      map.setFilter(LAYER_LABEL, pf);
      map.setPaintProperty(
        LAYER_CIRCLE,
        "circle-color",
        eraColorMap[era] ?? "#ffffff"
      );

      map.setFilter(LAYER_TERRAIN_WATER, terrainFilter(era, "water"));
      map.setFilter(
        LAYER_TERRAIN_WATERWAY,
        terrainFilter(era, "waterway")
      );
      map.setFilter(
        LAYER_TERRAIN_DISTRICT,
        terrainFilter(era, "district")
      );
      map.setFilter(
        LAYER_TERRAIN_REDEV,
        terrainFilter(era, "redevelopment")
      );
      map.setFilter(LAYER_TERRAIN_OUTLINE, [
        "all",
        ["<=", ["coalesce", ["get", "minEra"], 0], era],
        [">=", ["coalesce", ["get", "maxEra"], 9999], era],
      ]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // --- 初期化 ---
  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialStyle = ERA_STYLES[currentEra].style;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: initialStyle,
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
      addOverlayLayers(map, currentEra);
      readyRef.current = true;
      currentStyleEraRef.current = currentEra;
    });

    // ポイントタップ — レイヤーが存在するときのみ
    map.on("click", (e) => {
      if (!map.getLayer(LAYER_CIRCLE)) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: [LAYER_CIRCLE],
      });
      if (features.length > 0 && onPointTapRef.current) {
        const id = (features[0].properties as { id: string }).id;
        onPointTapRef.current(id);
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

  // --- era 変更時: スタイル切替 or フィルタ更新 ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    // 同じスタイルならフィルタ更新だけ
    if (currentStyleEraRef.current === currentEra) {
      updateFilters(map, currentEra);
      return;
    }

    // スタイルが変わる → setStyle して再構築
    readyRef.current = false;
    const newStyle = ERA_STYLES[currentEra].style;

    // 現在のカメラ位置を保存
    const curCenter = map.getCenter();
    const curZoom = map.getZoom();

    map.once("style.load", () => {
      // カメラ位置を復元
      map.setCenter(curCenter);
      map.setZoom(curZoom);
      // オーバーレイ再追加
      addOverlayLayers(map, currentEra);
      readyRef.current = true;
      currentStyleEraRef.current = currentEra;
    });

    map.setStyle(newStyle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEra]);

  return <div ref={containerRef} className="h-full w-full" />;
}
