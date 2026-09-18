"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Tách từ HomeClient.tsx — thanh tab dạng "viên thuốc" trượt (dùng ở nhiều
// view: Nhật ký hoạt động, Chờ duyệt giá... và giờ cả OrdersView) nên đưa
// vào components/admin/ dùng chung thay vì định nghĩa riêng ở từng file.
export type SegmentedItem = { key: string; label: React.ReactNode; active: boolean; onClick: () => void };

export default function Segmented({ items, style }: { items: SegmentedItem[]; style?: React.CSSProperties }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const activeKey = items.find((it) => it.active)?.key;

  useLayoutEffect(() => {
    const container = containerRef.current;
    const activeIndex = items.findIndex((it) => it.active);
    if (!container || activeIndex === -1) return;
    const btn = container.querySelectorAll("button")[activeIndex] as HTMLButtonElement | undefined;
    if (!btn) return;
    setThumbStyle({ opacity: 1, width: btn.offsetWidth, transform: `translateX(${btn.offsetLeft}px)` });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey, items.length, items.map((it) => String(it.label)).join("|")]);

  return (
    <div className="segmented" style={style} ref={containerRef}>
      <div className="segmented-thumb" style={thumbStyle} />
      {items.map((it) => (
        <button key={it.key} type="button" className={it.active ? "active" : ""} onClick={it.onClick}>
          {it.label}
        </button>
      ))}
    </div>
  );
}
