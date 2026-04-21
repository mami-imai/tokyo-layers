import type { Feature, Point, Polygon, MultiPolygon, FeatureCollection } from "geojson";

/** 対応する年代 */
export type Era = 1900 | 1955 | 1985 | 2025;

/** 年代レイヤー定義 */
export type EraDef = {
  year: Era;
  label: string;
  color: string;
  description: string;
};

/** カテゴリ定義 */
export type CategoryDef = {
  icon: string;
  color: string;
};

/** 地図上のポイント properties */
export type PointProperties = {
  id: string;
  name: string;
  eras: Era[];
  category: string;
};

export type PointFeature = Feature<Point, PointProperties>;
export type PointCollection = FeatureCollection<Point, PointProperties>;

/** 変遷カード 1エントリ */
export type StoryEntry = {
  title: string;
  description: string;
  peak: boolean;
  features: string[];
};

/** 地点ID → 年代ごとのストーリー */
export type PointStory = Partial<Record<string, StoryEntry>>;

/** 地形ポリゴンの種別 */
export type TerrainType = "water" | "waterway" | "district" | "redevelopment";

/** 地形ポリゴンの properties */
export type TerrainProperties = {
  id: string;
  name: string;
  type: TerrainType;
  description: string;
  /** この地形が存在する最古の年代（省略時は最古から表示） */
  minEra?: number;
  /** この地形が存在する最新の年代（省略時は最新まで表示） */
  maxEra?: number;
};

export type TerrainFeature = Feature<Polygon | MultiPolygon, TerrainProperties>;
export type TerrainCollection = FeatureCollection<Polygon | MultiPolygon, TerrainProperties>;

/** mock/tokyo-layers.json のルート型 */
export type TokyoLayersData = {
  meta: {
    title: string;
    description: string;
    center: [number, number];
    zoom: number;
    version: string;
  };
  eras: EraDef[];
  categories: Record<string, CategoryDef>;
  points: PointCollection;
  stories: Record<string, PointStory>;
  terrains: TerrainCollection;
};
