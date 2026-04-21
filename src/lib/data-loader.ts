/**
 * データ読み込み層
 * 現在: ローカルJSONをimport
 * 将来: API fetch / Supabase / 国土地理院API に差し替え
 */
import type { TokyoLayersData } from "@/types";
import rawData from "../../mock/tokyo-layers.json";

// JSON を型付きで取得
const data = rawData as unknown as TokyoLayersData;

export function getMeta() {
  return data.meta;
}

export function getEras() {
  return data.eras;
}

export function getCategories() {
  return data.categories;
}

export function getPoints() {
  return data.points;
}

export function getStory(pointId: string) {
  return data.stories[pointId] ?? null;
}

export function getTerrains() {
  return data.terrains;
}
