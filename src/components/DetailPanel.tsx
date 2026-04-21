"use client";

import type { Era, EraDef, PointStory, StoryEntry } from "@/types";

type Props = {
  pointName: string;
  category: string;
  story: PointStory;
  eras: EraDef[];
  currentEra: Era;
  /** 将来: AI生成の要約テキストなどを差し込むスロット */
  extraContent?: React.ReactNode;
};

/**
 * 変遷カード — 地点の歴史をタイムライン形式で表示
 *
 * データ差し替えポイント:
 * - story: 現在は mock JSON → 将来は API / AI 生成
 * - extraContent: AI 説明文やリンク集など自由に追加可能
 */
export default function DetailPanel({
  pointName,
  category,
  story,
  eras,
  currentEra,
  extraContent,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* ヘッダ�� */}
      <div>
        <h2 className="text-xl font-bold text-white">{pointName}</h2>
        <span className="mt-0.5 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/60">
          {category}
        </span>
      </div>

      {/* タイムライン */}
      <div className="flex flex-col gap-0">
        {eras.map((eraDef) => {
          const entry: StoryEntry | undefined = story[String(eraDef.year)];
          const isActive = eraDef.year === currentEra;

          return (
            <TimelineItem
              key={eraDef.year}
              eraDef={eraDef}
              entry={entry ?? null}
              isActive={isActive}
              isLast={eraDef.year === eras[eras.length - 1].year}
            />
          );
        })}
      </div>

      {/* 拡張スロット: AI要約・外部リンクなど */}
      {extraContent && (
        <div className="border-t border-white/10 pt-3">{extraContent}</div>
      )}
    </div>
  );
}

/** タイムライン1行 */
function TimelineItem({
  eraDef,
  entry,
  isActive,
  isLast,
}: {
  eraDef: EraDef;
  entry: StoryEntry | null;
  isActive: boolean;
  isLast: boolean;
}) {
  return (
    <div className="flex gap-3">
      {/* 縦線 + ドット */}
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 shrink-0 rounded-full border-2 ${
            isActive ? "scale-125" : ""
          }`}
          style={{
            borderColor: eraDef.color,
            backgroundColor: isActive ? eraDef.color : "transparent",
          }}
        />
        {!isLast && <div className="w-px grow bg-white/15" />}
      </div>

      {/* コンテンツ */}
      <div className={`pb-4 ${isActive ? "" : "opacity-50"}`}>
        <div className="flex items-baseline gap-2">
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: eraDef.color }}
          >
            {eraDef.year}
          </span>
          <span className="text-[10px] text-white/40">{eraDef.label}</span>
          {entry?.peak && (
            <span className="rounded bg-amber-500/20 px-1 py-px text-[9px] font-medium text-amber-400">
              最盛期
            </span>
          )}
        </div>

        {entry ? (
          <>
            <p className="mt-0.5 text-sm font-medium text-white/90">
              {entry.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              {entry.description}
            </p>
            {entry.features.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {entry.features.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mt-0.5 text-xs text-white/30 italic">データなし</p>
        )}
      </div>
    </div>
  );
}
