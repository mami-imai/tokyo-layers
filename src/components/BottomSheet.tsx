"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * スマホ向けボトムシート
 * - 開閉アニメーション（CSS transition）
 * - 上方向スワイプで開く / 下方向スワイプで閉じる
 * - 背景タップで閉じる
 */
export default function BottomSheet({ open, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);

  // スワイプ開始
  function handleTouchStart(e: React.TouchEvent) {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
    setDragY(0);
  }

  // スワイプ中
  function handleTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current) return;
    const dy = e.touches[0].clientY - startYRef.current;
    // 下方向のみ追従（閉じる方向）
    if (dy > 0) setDragY(dy);
  }

  // スワイプ終了
  function handleTouchEnd() {
    draggingRef.current = false;
    // 80px 以上下にスワイプしたら閉じる
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
  }

  // ESC キーで閉じる（デバッグ用）
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* 背景オーバーレイ */}
      <div
        className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      {/* シート本体 */}
      <div
        ref={sheetRef}
        className={`fixed right-0 bottom-0 left-0 z-30 max-h-[75dvh] overflow-y-auto rounded-t-2xl bg-zinc-900 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={
          open && dragY > 0
            ? { transform: `translateY(${dragY}px)`, transition: "none" }
            : undefined
        }
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* ドラッグハンドル */}
        <div className="sticky top-0 z-10 flex justify-center bg-zinc-900 pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-white/30" />
        </div>

        <div className="px-5 pb-6">{children}</div>
      </div>
    </>
  );
}
